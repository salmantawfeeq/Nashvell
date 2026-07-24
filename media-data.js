// Static fallback for media.html, used by media-loader.js when Supabase is
// unreachable. Mirrors the rows in supabase/seed_media.sql — keep in sync if
// the seed changes.

const MEDIA_PAGE_FALLBACK = {
  hero_tag_en: 'News & Updates', hero_tag_ar: 'الأخبار والتحديثات',
  hero_title_en: 'Media Center', hero_title_ar: 'المركز الإعلامي',
  hero_sub_en: 'Stay updated with the latest news, press releases and announcements.',
  hero_sub_ar: 'ابقَ على اطلاع بآخر الأخبار والبيانات الصحفية والإعلانات.',
  hero_image_url: 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=1600',
  news_tag_en: 'Latest News', news_tag_ar: 'آخر الأخبار',
  news_title_en: 'Press & Media', news_title_ar: 'الصحافة والإعلام',
  btn_read_more_en: 'Read More', btn_read_more_ar: 'اقرأ المزيد',
  video_title_en: 'Watch Our Story', video_title_ar: 'شاهد قصتنا',
  video_desc_en: 'Discover how Nashvell International Trading Co. Ltd. connects Sudan to the world through three decades of excellence.',
  video_desc_ar: 'اكتشف كيف تربط شركة ناشڤيل للتجارة الدولية المحدودة السودان بالعالم عبر ثلاثة عقود من التميز.',
  video_bg_image_url: 'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=1600',
};

const MEDIA_NEWS_FALLBACK = [
  { image_url: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=800', date_en: 'March 15, 2024', date_ar: '15 مارس 2024', title_en: 'Nashvell Expands Agricultural Exports to Asian Markets', title_ar: 'ناشڤيل توسّع صادراتها الزراعية إلى الأسواق الآسيوية', desc_en: 'We are proud to announce the expansion of our agricultural export operations to include three new Asian markets, strengthening our global trade network.', desc_ar: 'يسعدنا الإعلان عن توسيع عمليات التصدير الزراعي لدينا لتشمل ثلاثة أسواق آسيوية جديدة، مما يعزز شبكتنا التجارية العالمية.', link_url: '#', display_order: 0 },
  { image_url: 'https://images.pexels.com/photos/7988079/pexels-photo-7988079.jpeg?auto=compress&cs=tinysrgb&w=800', date_en: 'February 28, 2024', date_ar: '28 فبراير 2024', title_en: 'New Technology Division Launches AI-Powered ERP Platform', title_ar: 'قسم التقنية الجديد يطلق منصة ERP مدعومة بالذكاء الاصطناعي', desc_en: 'Our technology division has launched a new AI-powered ERP platform designed specifically for trading companies in the MENA region.', desc_ar: 'أطلق قسم التقنية لدينا منصة ERP جديدة مدعومة بالذكاء الاصطناعي مصممة خصيصًا للشركات التجارية في منطقة الشرق الأوسط وشمال إفريقيا.', link_url: '#', display_order: 1 },
  { image_url: 'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=800', date_en: 'January 10, 2024', date_ar: '10 يناير 2024', title_en: 'Port Sudan Logistics Hub Reaches Record Capacity', title_ar: 'مركز بورتسودان اللوجستي يبلغ طاقة قياسية', desc_en: 'Our logistics hub at Port Sudan has achieved record-breaking cargo throughput, cementing our position as a regional logistics leader.', desc_ar: 'حقق مركزنا اللوجستي في بورتسودان إنتاجية شحن قياسية، مما رسّخ مكانتنا كرائد لوجستي إقليمي.', link_url: '#', display_order: 2 },
  { image_url: 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=800', date_en: 'December 5, 2023', date_ar: '5 ديسمبر 2023', title_en: 'Strategic Investment Partnership with Saudi Investors', title_ar: 'شراكة استثمارية استراتيجية مع مستثمرين سعوديين', desc_en: 'We have signed a strategic investment partnership with leading Saudi investors to develop commercial real estate projects in Riyadh.', desc_ar: 'وقّعنا شراكة استثمارية استراتيجية مع مستثمرين سعوديين رائدين لتطوير مشاريع عقارية تجارية في الرياض.', link_url: '#', display_order: 3 },
  { image_url: 'https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=800', date_en: 'November 18, 2023', date_ar: '18 نوفمبر 2023', title_en: 'New Mining Partnership Signed in Red Sea Hills', title_ar: 'توقيع شراكة تعدين جديدة في جبال البحر الأحمر', desc_en: "A new mining partnership has been established to develop gold extraction operations in Sudan's mineral-rich Red Sea Hills region.", desc_ar: 'تأسست شراكة تعدين جديدة لتطوير عمليات استخراج الذهب في منطقة جبال البحر الأحمر الغنية بالمعادن في السودان.', link_url: '#', display_order: 4 },
  { image_url: 'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?auto=compress&cs=tinysrgb&w=800', date_en: 'October 2, 2023', date_ar: '2 أكتوبر 2023', title_en: 'Nashvell Wins Best Exporter Award 2023', title_ar: 'ناشڤيل تفوز بجائزة أفضل مُصدِّر 2023', desc_en: "We are honored to receive the Sudan Export Excellence Award for 2023, recognizing our contribution to the nation's export growth.", desc_ar: 'يشرّفنا الحصول على جائزة التميز في التصدير بالسودان لعام 2023، تقديرًا لإسهامنا في نمو صادرات البلاد.', link_url: '#', display_order: 5 },
];
