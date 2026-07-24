// Static fallback for gallery.html, used by gallery-loader.js when Supabase
// is unreachable. Mirrors the rows in supabase/seed_projects_gallery.sql —
// keep in sync if the seed changes.
const GALLERY_FALLBACK_DATA = [
  { image_url: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Agricultural Products', display_order: 0 },
  { image_url: 'https://images.pexels.com/photos/2749165/pexels-photo-2749165.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Natural Oils', display_order: 1 },
  { image_url: 'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Logistics', display_order: 2 },
  { image_url: 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Livestock', display_order: 3 },
  { image_url: 'https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Mining', display_order: 4 },
  { image_url: 'https://images.pexels.com/photos/1797428/pexels-photo-1797428.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Industrial', display_order: 5 },
  { image_url: 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Investment', display_order: 6 },
  { image_url: 'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Corporate', display_order: 7 },
  { image_url: 'https://images.pexels.com/photos/7988079/pexels-photo-7988079.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Technology', display_order: 8 },
  { image_url: 'https://images.pexels.com/photos/5908874/pexels-photo-5908874.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Hibiscus', display_order: 9 },
  { image_url: 'https://images.pexels.com/photos/5769086/pexels-photo-5769086.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Peanuts', display_order: 10 },
  { image_url: 'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=1200', image_alt: 'Construction', display_order: 11 },
];
