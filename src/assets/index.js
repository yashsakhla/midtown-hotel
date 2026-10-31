/* Hotel photographs and room illustrations — bundled with the app. */
import BANNER from './banner.jpg';
import EXT1 from './ext1.jpg';
import EXT2 from './ext2.jpg';
import ROOM_STD from './room_std.jpg';
import ROOM_DLX from './room_dlx.jpg';
import ROOM_STE from './room_ste.jpg';

import F_VTHALI from './f_vthali.jpg';
import F_NVTHALI from './f_nvthali.jpg';
import F_PANEER from './f_paneer.jpg';
import F_CHICKEN from './f_chicken.jpg';
import F_DAL from './f_dal.jpg';
import F_BIRYANI from './f_biryani.jpg';
import F_BUTTERROTI from './f_butterroti.jpg';
import F_TANDROTI from './f_tandroti.jpg';
import F_JEERA from './f_jeera.jpg';
import F_DOSA from './f_dosa.jpg';
import F_PAKODA from './f_pakoda.jpg';
import F_SALAD from './f_salad.jpg';
import F_CHAI from './f_chai.jpg';
import F_COLD from './f_cold.jpg';
import F_LIME from './f_lime.jpg';
import F_GULAB from './f_gulab.jpg';

import ART_VACANT from './art_vacant.jpg';
import ART_OCCUPIED from './art_occupied.jpg';
import ART_DIRTY from './art_dirty.jpg';

export const HERO = BANNER;
export const EXTERIOR = [EXT1, EXT2];

/** Room photograph by room type. */
export const ROOM_IMG = {
  Standard: ROOM_STD,
  Deluxe: ROOM_DLX,
  Executive: ROOM_STE,
  Suite: ROOM_STE
};

/** Illustration shown on a room card, by status. */
export const ROOM_ART = {
  vacant: ART_VACANT,
  occupied: ART_OCCUPIED,
  dirty: ART_DIRTY,
  ooo: ART_VACANT
};

/** Menu photographs, keyed by dish name. */
export const FOOD_IMG = {
  'Veg Thali': F_VTHALI,
  'Non-veg Thali': F_NVTHALI,
  'Paneer Butter Masala': F_PANEER,
  'Chicken Curry': F_CHICKEN,
  'Dal Tadka': F_DAL,
  'Veg Biryani': F_BIRYANI,
  'Butter Roti': F_BUTTERROTI,
  'Tandoori Roti': F_TANDROTI,
  'Jeera Rice': F_JEERA,
  'Masala Dosa': F_DOSA,
  'Veg Pakoda': F_PAKODA,
  'Green Salad': F_SALAD,
  'Masala Chai': F_CHAI,
  'Cold Drink': F_COLD,
  'Fresh Lime Soda': F_LIME,
  'Gulab Jamun': F_GULAB
};

export const foodImg = (name) => FOOD_IMG[name] || F_VTHALI;
