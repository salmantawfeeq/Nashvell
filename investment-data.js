// Static fallback for investment.html, used by investment-loader.js when
// Supabase is unreachable. Mirrors the rows in
// supabase/seed_investment.sql — keep in sync if the seed changes.

const INVESTMENT_PAGE_FALLBACK = {
  hero_tag_en: 'Grow With Us', hero_tag_ar: 'انمُ معنا',
  hero_title_en: 'Investment Opportunities', hero_title_ar: 'فرص الاستثمار',
  hero_sub_en: 'Strategic partnerships and investment opportunities across high-growth sectors.',
  hero_sub_ar: 'شراكات استراتيجية وفرص استثمارية في قطاعات عالية النمو.',
  intro_tag_en: 'Why Invest With Us', intro_tag_ar: 'لماذا تستثمر معنا',
  intro_title_en: 'Building Wealth Through Strategic Partnerships', intro_title_ar: 'بناء الثروة من خلال الشراكات الاستراتيجية',
  intro_p1_en: 'For over 30 years, Nashvell has created value for investors through carefully selected opportunities in trade, technology, infrastructure and natural resources. We combine deep market knowledge with a global network to deliver sustainable returns.',
  intro_p1_ar: 'على مدى أكثر من 30 عامًا، خلقت ناشڤيل قيمة للمستثمرين من خلال فرص منتقاة بعناية في التجارة والتقنية والبنية التحتية والموارد الطبيعية. نجمع بين المعرفة العميقة بالسوق وشبكة عالمية لتحقيق عوائد مستدامة.',
  intro_image_url: 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=1000',
  sectors_tag_en: 'Our Focus Areas', sectors_tag_ar: 'مجالات تركيزنا',
  sectors_title_en: 'Investment Sectors', sectors_title_ar: 'قطاعات الاستثمار',
  process_tag_en: 'How It Works', process_tag_ar: 'كيف تسير العملية',
  process_title_en: 'Investment Process', process_title_ar: 'عملية الاستثمار',
  cta_title_en: 'Ready to Invest?', cta_title_ar: 'هل أنت مستعد للاستثمار؟',
  cta_desc_en: 'Schedule a consultation with our investment team to explore opportunities.',
  cta_desc_ar: 'احجز استشارة مع فريق الاستثمار لدينا لاستكشاف الفرص.',
  cta_btn_en: 'Book a Consultation', cta_btn_ar: 'احجز استشارة',
};

const INVESTMENT_FEATURES_FALLBACK = [
  { text_en: 'Diversified portfolio across sectors', text_ar: 'محفظة متنوعة عبر القطاعات', display_order: 0 },
  { text_en: 'Access to emerging African markets', text_ar: 'الوصول إلى الأسواق الإفريقية الناشئة', display_order: 1 },
  { text_en: 'Strong track record of returns', text_ar: 'سجل حافل من العوائد', display_order: 2 },
  { text_en: 'Expert risk management', text_ar: 'إدارة خبيرة للمخاطر', display_order: 3 },
];

const INVESTMENT_SECTORS_FALLBACK = [
  { icon: 'bi-graph-up-arrow', title_en: 'Trade & Commerce', title_ar: 'التجارة والتبادل التجاري', desc_en: 'Investment in export-import operations, supply chain infrastructure and cross-border trade facilitation.', desc_ar: 'الاستثمار في عمليات التصدير والاستيراد، والبنية التحتية لسلسلة الإمداد، وتيسير التجارة العابرة للحدود.', display_order: 0 },
  { icon: 'bi-cpu', title_en: 'Technology', title_ar: 'التقنية', desc_en: 'Venture investments in AI, cloud computing, cyber security and digital transformation startups.', desc_ar: 'استثمارات في الشركات الناشئة في الذكاء الاصطناعي والحوسبة السحابية والأمن السيبراني والتحول الرقمي.', display_order: 1 },
  { icon: 'bi-building', title_en: 'Real Estate', title_ar: 'العقارات', desc_en: 'Premium commercial and residential property developments in Saudi Arabia and the wider region.', desc_ar: 'تطويرات عقارية تجارية وسكنية فاخرة في المملكة العربية السعودية والمنطقة الأوسع.', display_order: 2 },
  { icon: 'bi-truck', title_en: 'Logistics', title_ar: 'الخدمات اللوجستية', desc_en: 'Investment in warehousing, port operations, fleet management and transportation networks.', desc_ar: 'الاستثمار في التخزين وعمليات الموانئ وإدارة الأساطيل وشبكات النقل.', display_order: 3 },
  { icon: 'bi-gem', title_en: 'Mining & Resources', title_ar: 'التعدين والموارد', desc_en: 'Strategic investments in gold, chromite and mineral extraction operations across Sudan.', desc_ar: 'استثمارات استراتيجية في عمليات استخراج الذهب والكروميت والمعادن في أنحاء السودان.', display_order: 4 },
  { icon: 'bi-flower1', title_en: 'Agriculture', title_ar: 'الزراعة', desc_en: 'Investment in agricultural projects, processing facilities and sustainable farming initiatives.', desc_ar: 'الاستثمار في المشاريع الزراعية ومنشآت المعالجة ومبادرات الزراعة المستدامة.', display_order: 5 },
];

const INVESTMENT_STEPS_FALLBACK = [
  { step_number: '01', title_en: 'Consultation', title_ar: 'الاستشارة', desc_en: 'We discuss your investment goals and risk appetite to identify suitable opportunities.', desc_ar: 'نناقش أهدافك الاستثمارية ومدى تقبّلك للمخاطر لتحديد الفرص المناسبة.', display_order: 0 },
  { step_number: '02', title_en: 'Analysis', title_ar: 'التحليل', desc_en: 'Our experts conduct thorough feasibility studies and due diligence on each opportunity.', desc_ar: 'يجري خبراؤنا دراسات جدوى شاملة وفحصًا دقيقًا لكل فرصة.', display_order: 1 },
  { step_number: '03', title_en: 'Partnership', title_ar: 'الشراكة', desc_en: 'We structure the investment and formalize the partnership with transparent terms.', desc_ar: 'نهيكل الاستثمار ونرسّم الشراكة بشروط شفافة.', display_order: 2 },
  { step_number: '04', title_en: 'Growth', title_ar: 'النمو', desc_en: 'We actively manage investments and provide regular performance reports to partners.', desc_ar: 'ندير الاستثمارات بفاعلية ونقدم تقارير أداء دورية للشركاء.', display_order: 3 },
];
