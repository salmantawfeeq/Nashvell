// Static fallback for chairman-message.html, used by chairman-loader.js when
// Supabase is unreachable. Mirrors the row in supabase/seed_chairman.sql —
// keep in sync if the seed changes.
const CHAIRMAN_PAGE_FALLBACK = {
  hero_tag_en: 'Leadership', hero_tag_ar: 'القيادة',
  hero_title_en: "Chairman's Message", hero_title_ar: 'كلمة رئيس مجلس الإدارة',
  hero_subtitle_en: 'A strategic vision for building sustainable trade and investment bridges across the world.',
  hero_subtitle_ar: 'رؤية استراتيجية لبناء جسور تجارية واستثمارية مستدامة حول العالم.',
  hero_image_url: 'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photo_url: './photo/dr.salsh2.png',
  badge_num: '30+', badge_label_en: 'Years of Experience', badge_label_ar: 'سنة من الخبرة',
  role_en: 'Chairman of the Board', role_ar: 'رئيس مجلس الإدارة',
  name_en: 'Dr. Salah Al-Amin Hadousi', name_ar: 'د. صلاح الأمين حدوثي',
  p1_en: 'Dr. Salah Al-Amin Hadousi leads Nashvell International Trade with an ambitious strategic vision aimed at building sustainable trade and investment bridges between the Kingdom of Saudi Arabia and regional and global markets, with a strong focus on promoting investment opportunities and commercial exchange across the sectors of agriculture, mining, energy, industry, and logistics.',
  p1_ar: 'يقود الدكتور صلاح الأمين حدوثي شركة ناشڤيل للتجارة الدولية برؤية استراتيجية طموحة تهدف إلى بناء جسور تجارية واستثمارية مستدامة بين المملكة العربية السعودية والأسواق الإقليمية والعالمية، مع التركيز على تعزيز فرص الاستثمار والتبادل التجاري في قطاعات الزراعة والتعدين والطاقة والصناعة والخدمات اللوجستية.',
  p2_en: 'Dr. Salah Al-Amin Hadousi possesses more than three decades of professional and executive experience in executive management, financial and administrative systems, business development, project management, and international investments. Throughout his career, he has contributed to the establishment and development of numerous commercial and investment initiatives and projects both within the Kingdom of Saudi Arabia and internationally.',
  p2_ar: 'يمتلك الدكتور صلاح الأمين حدوثي خبرة مهنية وإدارية تمتد لأكثر من ثلاثة عقود في مجالات الإدارة التنفيذية والأنظمة المالية والإدارية وتطوير الأعمال وإدارة المشاريع والاستثمارات الدولية، وقد ساهم خلال مسيرته المهنية في تأسيس وتطوير العديد من المبادرات والمشروعات التجارية والاستثمارية داخل المملكة العربية السعودية وخارجها.',
  p3_en: "He holds a Master's Degree in Systems Analysis, in addition to his academic specialization in Cost Accounting, Information Systems, and Business Administration. This unique combination of expertise has enabled him to integrate managerial excellence with technological vision in leading organizations, driving innovation, and achieving sustainable growth.",
  p3_ar: 'ويحمل درجة الماجستير في تحليل النظم، إضافة إلى تخصصه الأكاديمي في المحاسبة والتكاليف ونظم المعلومات، الأمر الذي مكّنه من الجمع بين الخبرة الإدارية والرؤية التقنية في قيادة المؤسسات وتطويرها وتحقيق النمو المستدام.',
  p4_en: 'Under his leadership, Nashvell International Trade provides integrated solutions in international trade, investment consulting, project development, and strategic partnership building, while maintaining the highest standards of quality, transparency, and professionalism.',
  p4_ar: 'وتعمل شركة ناشڤيل للتجارة الدولية تحت قيادته على تقديم حلول متكاملة في مجالات التجارة الدولية والاستشارات الاستثمارية وتطوير المشاريع وبناء الشراكات الاستراتيجية، مع الالتزام بأعلى معايير الجودة والشفافية والاحترافية.',
  btn_contact_en: 'Get in Touch', btn_contact_ar: 'تواصل معنا',
  btn_about_en: 'Back to About Us', btn_about_ar: 'العودة إلى من نحن',
  quote_en: 'We believe that true success is achieved through building long-term partnerships that create sustainable value for investors, partners, and the communities in which we operate.',
  quote_ar: 'نؤمن بأن النجاح الحقيقي يتحقق من خلال بناء شراكات طويلة الأمد تخلق قيمة مستدامة للمستثمرين والشركاء والمجتمعات التي نعمل فيها.',
  quote_attribution_en: 'Dr. Salah Al-Amin Hadousi — Chairman of the Board',
  quote_attribution_ar: 'د. صلاح الأمين حدوثي — رئيس مجلس الإدارة',
};
