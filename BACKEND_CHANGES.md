# Backend changes for the customer-centric Guest App

Paste the section **"Prompt for the backend"** below to the backend developer / AI.
Base URL stays `/api/v1`. All responses stay wrapped as `{ "data": ... }`, errors as `{ "error": { "message": "..." } }`.

---

## Prompt for the backend

> We are changing the Midtown Guest App from **"one guest = one room stay"** to **"one customer (identified by phone number) = many bookings, each booking can hold many rooms"**. The frontend is already updated and expects the contract below. Please implement it.
>
> ### 1. Login with phone number only (no room number)
>
> - `POST /auth/guest/request-otp` — body `{ "phone": "9876543210" }` (10-digit, already normalised by the app). **Remove `roomNumber` from this endpoint.** Send the OTP by SMS. Rate-limit per phone.
> - `POST /auth/guest/verify-otp` — body `{ "phone", "otp" }` → `{ "accessToken": "..." }`.
>   - If no `Customer` exists for this phone, **create one** (name empty). Anyone can log in, even with no bookings.
>   - The token identifies the **customer**, not a stay. It must stay valid as long as the customer is logged in (not tied to check-out date).
> - The old room-number login can be removed.
>
> ### 2. Data model
>
> - **Customer**: `id, phone (unique), name`. Name is set from the first booking if empty.
> - **Booking** (one per request, can have N rooms): `id, ref, customerId, guestName, phone, arrivalDate, departureDate, pax, status, note, createdAt`.
>   - `status` ∈ `REQUESTED | CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED`.
>   - A booking becomes `CHECKED_IN` when the front desk checks in at least one room; `CHECKED_OUT` when all rooms are checked out.
> - **Stay** (one per room inside a booking): `id (= stayId), bookingId, roomNumber, roomTypeId, rate, guestName, status (CONFIRMED | CHECKED_IN | CHECKED_OUT)`. The front desk assigns the room number at check-in, so rooms may have no number before that.
> - Folio lines, food orders (KOT) and service requests must be linked to a **stay (room)** so charges land on the right room and the booking total is the sum of its rooms.
> - When a front desk user or a public (visitor) booking creates a booking for a phone number, link it to the `Customer` with that phone (create the customer if needed). Existing bookings for that phone must show up when the customer logs in.
>
> ### 3. Endpoints (all require the customer token)
>
> **`GET /guest/me`** → `{ "id", "name", "phone" }`
>
> **`GET /guest/bookings`** → every booking of the logged-in customer, newest first. **Replaces `GET /guest/stay`.**
> ```json
> { "bookings": [{
>   "id": "bk_1", "ref": "MT-1042", "status": "CHECKED_IN",
>   "guestName": "Ravi Kumar", "phone": "9876543210",
>   "arrivalDate": "2026-11-14", "departureDate": "2026-11-17", "nights": 3, "pax": 4,
>   "amount": 12000,          // total tariff for all rooms
>   "balance": 3400,          // outstanding folio balance across all rooms (0 once settled)
>   "invoiceUrl": "",         // final GST invoice PDF, only after check-out
>   "rooms": [
>     { "stayId": "st_1", "roomNumber": "204", "roomType": "Deluxe", "rate": 3000, "guestName": "Ravi Kumar", "status": "CHECKED_IN" },
>     { "stayId": "st_2", "roomNumber": "205", "roomType": "Standard", "rate": 2500, "guestName": "Sita Kumar", "status": "CHECKED_IN" }
>   ]
> }]}
> ```
> The app treats a booking as "staying now" when `status = CHECKED_IN` and a room as active when its `status = CHECKED_IN`. Past = `CHECKED_OUT | CANCELLED`. Upcoming = `REQUESTED | CONFIRMED`.
>
> **`GET /guest/bookings/:bookingId/folio`** → the bill for that booking (**replaces `GET /guest/folio`**). Must work for past bookings too, and must 404/403 if the booking belongs to another customer.
> ```json
> { "lines": [
>     { "id": "l1", "roomNumber": "204", "head": "Room tariff x 3 nights", "amount": 9000 },
>     { "id": "l2", "roomNumber": "205", "head": "Food order #55", "amount": 420 },
>     { "id": "l3", "roomNumber": "204", "head": "Advance paid", "amount": -2000 } ],
>   "balance": 7420, "paid": 2000, "invoiceUrl": "" }
> ```
> `roomNumber` per line is required so the app can label charges when a booking has several rooms.
>
> **`POST /guest/bookings`** (customer already logged in — **no OTP**) — same body as today:
> `{ guestName, phone, roomTypeId, rooms, pax, arrivalDate, departureDate, note }`.
> Create a `REQUESTED` booking with `rooms` room lines, linked to the logged-in customer (the `phone` in the body may differ — the booking may be for a friend/family; it stays linked to the **logged-in customer** so they can see it). Return `{ "booking": { "id", "ref", "status", "amount" } }`. A customer may create unlimited bookings, also while they are already staying.
> Keep the public `POST /public/bookings` (+ OTP) and `GET /public/room-types` for the "Just browsing" visitors; link the created booking to the customer with that phone.
>
> **`POST /guest/service-requests`** — **now multi-room**. Body: `{ "key": "housekeeping", "note": "", "stayIds": ["st_1", "st_2"] }`.
> - `stayIds` is required, ≥ 1, and every stay must belong to the customer **and be `CHECKED_IN`** (else 400 with a clear message).
> - Create **one service request per room** (or one request with a rooms list) so each room can be tracked/closed separately by staff, and show the room number(s) on the staff screen.
>
> **`GET /guest/service-requests`** → each item gets a `rooms` array: `{ "id", "key", "label", "status", "note", "createdAt", "rooms": [{ "roomNumber": "204" }, { "roomNumber": "205" }] }`. (If you create one record per room, group them by a shared `batchId` so the app shows one row.)
> Return the customer's requests for all their active stays.
>
> **`POST /guest/orders`** (food) — add **`stayId`** (required): `{ items, stayId, billTo: "ROOM" | "PAY_NOW", note }`. Validate the stay belongs to the customer and is `CHECKED_IN`. `billTo: ROOM` posts the charge to **that room's** folio line (with `roomNumber`). **`GET /guest/orders`** → each order includes `roomNumber`. Return orders for all the customer's active stays.
>
> **`POST /guest/checkout-request`** — body now `{ "note": "", "stayIds": ["st_1", "st_2"] }` (one or more rooms; same validation as service requests). Notify the front desk with the room numbers.
>
> **`POST /guest/feedback`** — body `{ rating, text, bookingId }` (allowed for `CHECKED_IN` and `CHECKED_OUT` bookings of this customer).
>
> **Remove / deprecate**: `GET /guest/stay`, `GET /guest/folio`.
> **Unchanged**: `GET /guest/menu`, `GET /guest/room-types`.
>
> ### 4. Rules and edge cases
>
> - Every `/guest/*` query must be scoped by `customerId` from the token — never trust ids from the client without checking ownership.
> - A customer with zero bookings must get `{ "bookings": [] }` (not an error); the app then shows only the Home screen with **Book a room**.
> - Food ordering and service requests are only allowed for rooms that are currently `CHECKED_IN` — return a clear 400 otherwise.
> - Phone normalisation: store 10-digit numbers without `+91`/`0`.
> - Return `401` when the token is invalid/expired (the app signs the user out on 401).
> - CORS/auth headers unchanged.
>
> ### 5. Please send back
> A short list of any field names that differ from the above, so the frontend mapper can be adjusted (it already tolerates `arrivalDate|checkIn`, `departureDate|checkOut`, `roomNumber|number`, `roomType|type`).

---

## What changed in the frontend (for reference)

| Area | Before | Now |
| --- | --- | --- |
| Login | Room number + phone + OTP | **Phone + OTP only**. "Just browsing" stays. Login card is centred on desktop. |
| Home (was "My stay") | One stay card | Staying-now cards (multi-room), **Book a room** button, upcoming + **past bookings** (tap → bill). No bookings → hero + Book a room only. |
| Menu / Orders tabs | Always shown | Shown only while the customer has a checked-in room. |
| Service request | One room implied | **Room picker, multi-select** (auto-selected if only one room). Same for check-out. |
| Food order | One room implied | "Deliver to" room selector, sends `stayId`. |
| Bills | Single folio | Per-booking bill (works for past bookings), room-labelled lines, invoice download link. |
| Booking | Tied to stay | Any number of bookings per customer; name/phone pre-filled, editable. |
