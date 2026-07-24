// Static fallback for index.html's Services panels, used by services-loader.js
// when Supabase is unreachable. Mirrors the rows in
// supabase/seed_services.sql — keep in sync if the seed changes.
const SERVICES_FALLBACK_DATA = [
  {
    title_en: 'Logistics Services', title_ar: 'خدمات لوجستية',
    image_url: 'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=800', image_alt: 'Logistics',
    description_en: '', description_ar: '', link_url: 'logistics.html', display_order: 0,
    items: [
      { icon: 'bi-truck', label_en: 'Road Freight', label_ar: 'شحن بري' },
      { icon: 'bi-airplane', label_en: 'Air Freight', label_ar: 'شحن جوي' },
      { icon: 'bi-file-earmark-check', label_en: 'Customs Clearance', label_ar: 'تخليص جمركي' },
      { icon: 'bi-building', label_en: 'Warehousing & Distribution', label_ar: 'تخزين وتوزيع' },
      { icon: 'bi-geo-alt', label_en: 'Shipment Tracking', label_ar: 'تتبع الشحنات' },
    ],
  },
  {
    title_en: 'Investment & Projects', title_ar: 'الاستثمار والمشاريع',
    image_url: 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=800', image_alt: 'Investment',
    description_en: '', description_ar: '', link_url: 'investment.html', display_order: 1,
    items: [
      { icon: 'bi-graph-up-arrow', label_en: 'Investment Opportunities', label_ar: 'فرص استثمارية' },
      { icon: 'bi-diagram-3', label_en: 'Strategic Partnerships', label_ar: 'شراكات استراتيجية' },
      { icon: 'bi-search', label_en: 'Feasibility Studies', label_ar: 'دراسات جدوى' },
      { icon: 'bi-gear', label_en: 'Project Management', label_ar: 'إدارة المشاريع' },
    ],
  },
  {
    title_en: 'Global Partnerships', title_ar: 'شراكات عالمية',
    image_url: 'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?auto=compress&cs=tinysrgb&w=800', image_alt: 'Global Partners',
    description_en: 'We work with partners around the world to build a better, more sustainable future through strong strategic trade relationships.',
    description_ar: 'نعمل مع شركاء حول العالم لبناء مستقبل أفضل وأكثر استدامة من خلال علاقات تجارية استراتيجية قوية.',
    link_url: 'about.html', display_order: 2,
    items: [],
  },
];
