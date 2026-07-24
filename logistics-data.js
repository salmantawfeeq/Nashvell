// Static fallback for logistics.html, used by logistics-loader.js when
// Supabase is unreachable. Mirrors the rows in supabase/seed_logistics.sql —
// keep in sync if the seed changes.

const LOGISTICS_PAGE_FALLBACK = {
  hero_tag_en: 'Global Supply Chain', hero_tag_ar: 'سلسلة الإمداد العالمية',
  hero_title_en: 'Logistics Services', hero_title_ar: 'الخدمات اللوجستية',
  hero_sub_en: 'End-to-end logistics solutions connecting Sudan to the world — by sea, air and land.',
  hero_sub_ar: 'حلول لوجستية متكاملة تربط السودان بالعالم — برًا وبحرًا وجوًا.',
  hero_image_url: 'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=1600',
  badge_en: 'Global Network', badge_ar: 'شبكة عالمية',
  intro_tag_en: 'Our Services', intro_tag_ar: 'خدماتنا',
  intro_title_en: 'Comprehensive Logistics Solutions', intro_title_ar: 'حلول لوجستية شاملة',
  intro_desc_en: 'From Port Sudan to global destinations, we manage every step of your supply chain with precision, reliability and care. Our integrated logistics platform ensures your cargo reaches its destination safely and on time.',
  intro_desc_ar: 'من بورتسودان إلى الوجهات العالمية، ندير كل خطوة في سلسلة إمدادك بدقة وموثوقية وعناية. تضمن منصتنا اللوجستية المتكاملة وصول شحنتك إلى وجهتها بأمان وفي الوقت المحدد.',
  intro_image_url: 'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=1000',
  track_tag_en: 'Track Your Shipment', track_tag_ar: 'تتبّع شحنتك',
  track_title_en: 'Shipment Tracking', track_title_ar: 'تتبع الشحنات',
  track_sub_en: 'Enter your tracking number to get real-time updates on your shipment.',
  track_sub_ar: 'أدخل رقم التتبع للحصول على تحديثات فورية عن شحنتك.',
  track_placeholder_en: 'Enter tracking number (e.g. NSV-2024-001234)', track_placeholder_ar: 'أدخل رقم التتبع (مثال: NSV-2024-001234)',
  track_btn_en: 'Track Now', track_btn_ar: 'تتبّع الآن',
};

const LOGISTICS_SERVICES_FALLBACK = [
  { icon: 'bi-truck', title_en: 'Sea Shipping', title_ar: 'الشحن البحري', desc_en: 'Full container and bulk shipping services through major global ports.', desc_ar: 'خدمات شحن الحاويات الكاملة والبضائع السائبة عبر الموانئ العالمية الرئيسية.', display_order: 0 },
  { icon: 'bi-airplane', title_en: 'Air Shipping', title_ar: 'الشحن الجوي', desc_en: 'Express air freight for time-sensitive cargo to any destination worldwide.', desc_ar: 'شحن جوي سريع للبضائع الحساسة للوقت إلى أي وجهة حول العالم.', display_order: 1 },
  { icon: 'bi-file-earmark-check', title_en: 'Custom Clearance', title_ar: 'التخليص الجمركي', desc_en: 'Expert customs documentation and clearance services at all major ports.', desc_ar: 'خدمات توثيق وتخليص جمركي احترافية في جميع الموانئ الرئيسية.', display_order: 2 },
  { icon: 'bi-building', title_en: 'Warehousing', title_ar: 'التخزين', desc_en: 'Secure storage facilities with modern inventory management systems.', desc_ar: 'منشآت تخزين آمنة بأنظمة إدارة مخزون حديثة.', display_order: 3 },
  { icon: 'bi-geo-alt', title_en: 'Shipment Tracking', title_ar: 'تتبع الشحنات', desc_en: 'Real-time tracking and monitoring of your shipments from origin to destination.', desc_ar: 'تتبع ومراقبة شحناتك في الوقت الفعلي من المنشأ إلى الوجهة.', display_order: 4 },
  { icon: 'bi-box-seam', title_en: 'Export Services', title_ar: 'خدمات التصدير', desc_en: 'Exporting authentic Sudanese products to markets around the world.', desc_ar: 'تصدير المنتجات السودانية الأصيلة إلى مختلف دول العالم.', display_order: 5 },
  { icon: 'bi-journal-check', title_en: 'Trade Agreements', title_ar: 'الاتفاقيات التجارية', desc_en: 'Managing trade contracts and international agreements on your behalf.', desc_ar: 'إدارة العقود التجارية والاتفاقيات الدولية نيابة عنك.', display_order: 6 },
];

const LOGISTICS_STATS_FALLBACK = [
  { number: 25, suffix: '+', label_en: 'Countries Served', label_ar: 'دولة مخدومة', display_order: 0 },
  { number: 50, suffix: '+', label_en: 'Global Ports', label_ar: 'ميناء عالمي', display_order: 1 },
  { number: 10000, suffix: '+', label_en: 'Shipments Delivered', label_ar: 'شحنة تم تسليمها', display_order: 2 },
  { number: 99, suffix: '%', label_en: 'On-Time Delivery', label_ar: 'التسليم في الوقت المحدد', display_order: 3 },
];
