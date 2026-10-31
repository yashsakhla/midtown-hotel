/** Descriptive fallbacks used when the API leaves a room-type field empty. */
export const ROOM_TYPES = [
  {
    type: 'Standard',
    beds: 'One queen bed',
    size: '180 sq ft',
    sleeps: 2,
    blurb: 'A calm, well-lit room with everything you need for a short stay — hot water around the clock, a work desk and daily housekeeping.',
    perks: ['Air conditioned', 'Free Wi-Fi', 'LED TV', 'Daily housekeeping']
  },
  {
    type: 'Deluxe',
    beds: 'One king bed',
    size: '240 sq ft',
    sleeps: 2,
    blurb: 'More room to spread out, a seating corner by the window and a larger bathroom. Our most booked room.',
    perks: ['Air conditioned', 'Free Wi-Fi', 'LED TV', 'Seating corner', 'Tea & coffee tray']
  },
  {
    type: 'Executive',
    beds: 'One king bed + sofa',
    size: '310 sq ft',
    sleeps: 3,
    blurb: 'Built for a longer stay or a business trip — a proper writing desk, a sofa that sleeps one and complimentary breakfast.',
    perks: ['Air conditioned', 'Free Wi-Fi', 'Work desk', 'Breakfast included', 'Early check-in on request']
  },
  {
    type: 'Suite',
    beds: 'King bed + living room',
    size: '480 sq ft',
    sleeps: 4,
    blurb: 'A separate living room, a dining table for four and the best view in the building. Our family and celebration room.',
    perks: ['Living room', 'Breakfast included', 'Free Wi-Fi', 'Mini fridge', 'Late check-out on request']
  }
];

export const SERVICES = [
  { key: 'housekeeping', label: 'Housekeeping', sub: 'Clean the room now' },
  { key: 'laundry', label: 'Laundry pickup', sub: 'Collected before 10 am' },
  { key: 'wifi', label: 'Wi-Fi help', sub: 'Password or connection trouble' },
  { key: 'taxi', label: 'Book a taxi', sub: 'Station, airport or local' },
  { key: 'call', label: 'Call front desk', sub: 'Someone will ring your room' },
  { key: 'checkout', label: 'Request check-out', sub: 'We prepare your bill' }
];

export const HOTEL = {
  name: 'The Midtown Hotel',
  address: 'Krishna Vatika Colony, Boidardar Road, Raigarh, Chhattisgarh 496001',
  phone: '92384 17169',
  checkInTime: '12:00 noon',
  checkOutTime: '11:00 am',
  wifi: { network: 'Midtown-Guest', password: 'midtown2026' }
};
