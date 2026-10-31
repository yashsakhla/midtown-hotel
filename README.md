# The Midtown Hotel — Guest App (React)

The guest-facing app for The Midtown Hotel. This is the app a visitor uses —
separate from the manager app the front desk runs.

Same design system as the manager app: cream and gold, Fraunces headings,
Plus Jakarta Sans body, all fonts self-hosted.

Built by MACROPAGE — MR Tech Solutions Pvt. Ltd.

## Running it

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # dist/ — upload anywhere
```

## What a guest can do

**My stay** — room number, check-in and check-out dates, nights left, a
running bill with the balance due, anything currently in progress, and four
one-tap shortcuts (order food, housekeeping, my bill, front desk).

**Rooms** — all four room types with photographs, bed and size, what is
included and the per-night tariff. "Book this room" sends a request to the
hotel; the guest is called back to confirm. No payment is taken in the app.

**Menu** — the full restaurant menu with photos, veg/non-veg marks, a veg-only
filter and category chips. Each dish opens with a quantity picker and a note
for the kitchen. The tray bar appears at the bottom once something is in it.
At checkout the guest chooses **add to my room bill** (goes straight onto the
folio, paid at check-out) or **pay on delivery**.

**Orders** — every food order with a four-step tracker (Placed → Preparing →
On the way → Served), all service requests, and all booking requests.

**Help** — hotel address with a call button and map link, Wi-Fi name and
password, the service list, hotel timings and a star-rating feedback form.

## Project layout

```
src/
  main.jsx            React root, wraps the app in GuestProvider
  App.jsx             Phone shell: top bar, screen, tray bar, sheets, tab bar
  index.css           Design system, shared with the manager app + guest styles
  store/
    GuestContext.jsx  All state and every action in one place
  data/seed.js        Room types, menu, services, hotel details, the demo stay
  lib/
    format.js         Dates, money, ids
    selectors.js      Folio total, tray totals, nights left, order progress
  components/         Card, Field, Pill, Stepper, ListRow, Sheet, icons
  screens/            My stay, Rooms, Menu, Orders, Help
  sheets/index.jsx    Dish, tray, bill, booking, service, check-out, feedback
  assets/             Hotel, room and food photographs
```

## Connecting it to the manager app

Both apps share the same shapes, so one backend serves both:

| Guest app does | Manager app sees |
|---|---|
| Places a food order | New KOT in the kitchen queue; charge on the room folio |
| Requests housekeeping or laundry | Service request at the front desk |
| Requests a booking | New entry in Bookings (OTA), source "Guest app" |
| Requests check-out | Front desk prepares the bill and the GST invoice |
| Views the bill | Reads the same folio the manager app writes to |

Replace `createInitialState()` in `src/data/seed.js` with your API call, and
post each action in `GuestContext.jsx` to the matching endpoint — the action
names map one-to-one.

**Sign-in:** right now the demo opens with a stay already in progress
(room 203). In production the guest signs in with their room number and the
phone number on their check-in record, and the stay comes back from the API.
A guest with no stay sees the welcome banner and can still browse rooms and
request a booking.

## Wrapping it as an Android / iOS app

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Midtown Guest" com.midtown.guest --web-dir=dist
npx cap add android
npm run build && npx cap sync && npx cap open android
```
