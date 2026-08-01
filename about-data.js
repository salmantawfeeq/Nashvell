// Static fallback for about.html, used by about-loader.js when Supabase is
// unreachable. Mirrors the rows in supabase/seed_about.sql — keep in sync if
// the seed changes.

const ABOUT_PAGE_FALLBACK = {
  hero_tag_en: 'Get to know us', hero_tag_ar: 'تعرّف علينا',
  hero_title_en: 'About Nashvell', hero_title_ar: 'عن ناشڤيل',
  hero_subtitle_en: 'Three decades of excellence in international trade, technology and investment.',
  hero_subtitle_ar: 'ثلاثة عقود من التميز في التجارة الدولية والتقنية والاستثمار.',
  hero_image_url: 'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?auto=compress&cs=tinysrgb&w=1600',
  story_tag_en: 'Our Story', story_tag_ar: 'قصتنا',
  story_title_en: 'A Legacy of International Trade', story_title_ar: 'إرثٌ في التجارة الدولية',
  story_p1_en: 'Founded in 1994, Nashvell International Trading Co. Ltd. has grown from a regional trading house into a diversified international enterprise. Headquartered in Khartoum, Sudan, with trusted partners in Riyadh, Saudi Arabia, we connect African products with global markets.',
  story_p1_ar: 'تأسست شركة ناشڤيل للتجارة الدولية المحدودة عام 1994، ونمت من بيت تجاري إقليمي إلى مؤسسة دولية متنوعة الأنشطة. يقع مقرها الرئيسي في الخرطوم، السودان، ولها شركاء موثوقون في الرياض بالمملكة العربية السعودية، ونربط المنتجات الإفريقية بالأسواق العالمية.',
  story_p2_en: 'Our operations span agricultural exports, natural oils, livestock, mining, industrial products, technology solutions, logistics and strategic investments — all driven by a commitment to quality, integrity and long-term partnerships.',
  story_p2_ar: 'تشمل عملياتنا الصادرات الزراعية والزيوت الطبيعية والمواشي والتعدين والمنتجات الصناعية والحلول التقنية والخدمات اللوجستية والاستثمارات الاستراتيجية — مدفوعةً بالتزامنا بالجودة والنزاهة والشراكات طويلة الأمد.',
  story_image_url: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1000',
  badge_num: '30+', badge_label_en: 'Years of Excellence', badge_label_ar: 'سنة من التميز',
  btn_contact_en: 'Get in Touch', btn_contact_ar: 'تواصل معنا',
  vision_tag_en: 'What Drives Us', vision_tag_ar: 'ما يدفعنا',
  vision_title_en: 'Vision, Mission & Values', vision_title_ar: 'الرؤية والرسالة والقيم',
  team_tag_en: 'Our Leadership', team_tag_ar: 'قيادتنا',
  team_title_en: 'Meet the Team', team_title_ar: 'تعرّف على الفريق',
  team_subtitle_en: 'Experienced leaders guiding our vision for global trade and innovation.',
  team_subtitle_ar: 'قادة ذوو خبرة يوجّهون رؤيتنا نحو التجارة العالمية والابتكار.',
  certs_tag_en: 'Quality & Trust', certs_tag_ar: 'الجودة والثقة',
  certs_title_en: 'Our Certifications', certs_title_ar: 'شهاداتنا',
};

const ABOUT_FEATURES_FALLBACK = [
  { text_en: 'Global trade network across 25+ countries', text_ar: 'شبكة تجارة عالمية في أكثر من 25 دولة', display_order: 0 },
  { text_en: 'Premium Sudanese products exported worldwide', text_ar: 'منتجات سودانية فاخرة تُصدَّر حول العالم', display_order: 1 },
  { text_en: 'Integrated technology and logistics solutions', text_ar: 'حلول تقنية ولوجستية متكاملة', display_order: 2 },
  { text_en: 'ISO-certified quality management systems', text_ar: 'أنظمة إدارة جودة معتمدة من ISO', display_order: 3 },
];

const ABOUT_VISION_CARDS_FALLBACK = [
  { icon: 'bi-eye', title_en: 'Our Vision', title_ar: 'رؤيتنا', desc_en: 'To be the leading bridge connecting Sudanese products and African resources with global markets, setting the standard for excellence in international trade.', desc_ar: 'أن نكون الجسر الرائد الذي يربط المنتجات السودانية والموارد الإفريقية بالأسواق العالمية، ونضع معيار التميز في التجارة الدولية.', display_order: 0 },
  { icon: 'bi-bullseye', title_en: 'Our Mission', title_ar: 'رسالتنا', desc_en: 'To deliver premium products, innovative technology solutions and reliable logistics services that create lasting value for our clients, partners and communities.', desc_ar: 'تقديم منتجات فاخرة وحلول تقنية مبتكرة وخدمات لوجستية موثوقة تخلق قيمة دائمة لعملائنا وشركائنا ومجتمعاتنا.', display_order: 1 },
  { icon: 'bi-gem', title_en: 'Our Values', title_ar: 'قيمنا', desc_en: 'Integrity, quality, innovation and partnership are the foundations of everything we do — guiding our relationships with clients, suppliers and communities.', desc_ar: 'النزاهة والجودة والابتكار والشراكة هي أسس كل ما نقوم به — وتوجّه علاقاتنا مع العملاء والموردين والمجتمعات.', display_order: 2 },
];

const ABOUT_STATS_FALLBACK = [
  { number: 30, suffix: '+', label_en: 'Years of Experience', label_ar: 'سنوات من الخبرة', display_order: 0 },
  { number: 25, suffix: '+', label_en: 'Countries Worldwide', label_ar: 'دولة حول العالم', display_order: 1 },
  { number: 200, suffix: '+', label_en: 'Sudanese Products', label_ar: 'منتج سوداني', display_order: 2 },
  { number: 500, suffix: '+', label_en: 'Clients & Partners', label_ar: 'عميل راضٍ', display_order: 3 },
  { number: 100, suffix: '+', label_en: 'Completed Projects', label_ar: 'مشروع مكتمل', display_order: 4 },
];

const ABOUT_TEAM_FALLBACK = [
  { photo_url: './photo/DR salah.jpeg', name_en: 'Dr. Salah', name_ar: 'د. صلاح', role_en: 'Owner of the Company', role_ar: 'مالك الشركة', link_url: 'chairman-message.html', link_label_en: "Read the Chairman's Message", link_label_ar: 'اقرأ كلمة رئيس مجلس الإدارة', display_order: 0 },
  { photo_url: 'https://images.pexels.com/photos/32844861/pexels-photo-32844861.jpeg?auto=compress&cs=tinysrgb&w=600', name_en: 'Khalid Mahmoud', name_ar: 'خالد محمود', role_en: 'Operating Officer', role_ar: 'مدير العمليات', link_url: '', link_label_en: '', link_label_ar: '', display_order: 1 },
  { photo_url: 'https://images.pexels.com/photos/34381970/pexels-photo-34381970.jpeg?auto=compress&cs=tinysrgb&w=600', name_en: 'Sarah Ibrahim', name_ar: 'سارة إبراهيم', role_en: 'Technology Officer', role_ar: 'مديرة التقنية', link_url: '', link_label_en: '', link_label_ar: '', display_order: 2 },
  { photo_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600', name_en: 'Omar Hassan', name_ar: 'عمر حسن', role_en: 'Financial Officer', role_ar: 'المدير المالي', link_url: '', link_label_en: '', link_label_ar: '', display_order: 3 },
];

const ABOUT_CERTIFICATIONS_FALLBACK = [
  { badge_url: './photo/certs/iso-9001.svg', title_en: 'ISO 9001:2015', title_ar: 'ISO 9001:2015', desc_en: 'Quality Management System Certified', desc_ar: 'معتمد في نظام إدارة الجودة', display_order: 0 },
  { badge_url: './photo/certs/iso-14001.svg', title_en: 'ISO 14001:2015', title_ar: 'ISO 14001:2015', desc_en: 'Environmental Management Certified', desc_ar: 'معتمد في الإدارة البيئية', display_order: 1 },
  { badge_url: './photo/certs/iso-45001.svg', title_en: 'ISO 45001:2018', title_ar: 'ISO 45001:2018', desc_en: 'Occupational Health & Safety', desc_ar: 'الصحة والسلامة المهنية', display_order: 2 },
  { badge_url: './photo/certs/best-exporter.svg', title_en: 'Best Exporter 2023', title_ar: 'أفضل مُصدِّر 2023', desc_en: 'Sudan Export Excellence Award', desc_ar: 'جائزة التميز في التصدير — السودان', display_order: 3 },
];
