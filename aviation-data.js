// Static fallback for aviation.html, used by aviation-loader.js when
// Supabase is unreachable. Mirrors the rows in supabase/seed_aviation.sql —
// keep in sync if the seed changes.

const AVIATION_PAGE_FALLBACK = {
  hero_tag_en: 'Strategic Sector', hero_tag_ar: 'قطاع استراتيجي',
  hero_title_en: 'Aviation & Airport Infrastructure', hero_title_ar: 'قطاع الطيران والمطارات',
  hero_sub_en: 'Integrated solutions in aircraft trading, airport development and modern aviation technologies.',
  hero_sub_ar: 'حلول متكاملة تشمل تجارة الطائرات وتطوير البنية التحتية للمطارات وتقنيات الطيران الحديثة.',
  hero_image_url: './photo/aviation-hero.jpeg',

  intro_tag_en: 'Our Sector', intro_tag_ar: 'قطاعنا',
  intro_title_en: 'Vision, Overview & Commitment', intro_title_ar: 'الرؤية والنبذة والالتزام',

  activities_tag_en: 'What We Do', activities_tag_ar: 'مجالات عملنا',
  activities_title_en: 'Business Activities', activities_title_ar: 'مجالات العمل',

  gallery_tag_en: 'Our Facilities', gallery_tag_ar: 'منشآتنا',
  gallery_title_en: 'Capabilities in Pictures', gallery_title_ar: 'قدراتنا في الصور',
};

const AVIATION_VISION_CARDS_FALLBACK = [
  {
    icon: 'bi-eye',
    title_en: 'Our Vision', title_ar: 'رؤيتنا',
    desc_en: 'Nashvell International Trade — Sudan aspires to become a leading regional and international company in the aviation and airport infrastructure sector by delivering innovative, integrated solutions in aircraft trading, airport development, aviation logistics, and advanced aerospace technologies. The company is committed to supporting economic growth and enhancing air transportation through world-class standards of quality, safety, and sustainability.',
    desc_ar: 'تطمح شركة ناشفيل للتجارة الدولية – السودان إلى أن تكون من الشركات الرائدة إقليميًا ودوليًا في قطاع الطيران والمطارات، من خلال تقديم حلول متكاملة ومبتكرة تشمل تجارة الطائرات، وتطوير البنية التحتية للمطارات، والخدمات اللوجستية، وتقنيات الطيران الحديثة، بما يسهم في دعم التنمية الاقتصادية وتعزيز حركة النقل الجوي وفق أعلى المعايير العالمية للجودة والسلامة والاستدامة.',
    display_order: 0,
  },
  {
    icon: 'bi-info-circle',
    title_en: 'Sector Overview', title_ar: 'نبذة عن القطاع',
    desc_en: "The Aviation & Airport Infrastructure Division is one of Nashvell's strategic business sectors. The company provides comprehensive solutions for civil and commercial aviation, airport planning and development, specialized aviation equipment, and related services through strategic partnerships with leading international manufacturers and service providers to meet the needs of governments, private investors, and public institutions.",
    desc_ar: 'يمثل قطاع الطيران والمطارات أحد القطاعات الإستراتيجية للشركة، حيث تعمل ناشفيل على توفير حلول متكاملة في مجالات الطيران المدني والتجاري، وإنشاء وتطوير المطارات، وتوريد المعدات والخدمات المتخصصة، من خلال شراكات مع كبرى الشركات العالمية، لتلبية احتياجات الحكومات والمؤسسات والمستثمرين.',
    display_order: 1,
  },
  {
    icon: 'bi-shield-check',
    title_en: 'Our Commitment', title_ar: 'التزامنا',
    desc_en: 'Nashvell International Trade is committed to delivering innovative, reliable, and sustainable aviation solutions through strategic partnerships with globally recognized aviation companies. We strive to execute world-class airport and aviation projects that meet the highest international standards of quality, operational excellence, safety, and environmental responsibility, creating long-term value for governments, investors, and business partners worldwide.',
    desc_ar: 'تلتزم شركة ناشفيل بتقديم خدمات متكاملة تعتمد على الابتكار، ونقل التقنيات الحديثة، وبناء الشراكات الإستراتيجية مع كبرى الشركات العالمية، لضمان تنفيذ مشاريع الطيران والمطارات وفق أعلى معايير الجودة والكفاءة، وبما يحقق قيمة مستدامة لعملائها وشركائها ويسهم في تطوير قطاع الطيران في الأسواق الإقليمية والدولية.',
    display_order: 2,
  },
];

const AVIATION_ACTIVITIES_FALLBACK = [
  { text_en: 'Buying, selling, and leasing commercial and private aircraft.', text_ar: 'شراء وبيع وتأجير الطائرات التجارية والخاصة.', display_order: 0 },
  { text_en: 'Trading cargo aircraft and government aircraft.', text_ar: 'شراء وبيع طائرات الشحن والطائرات الحكومية.', display_order: 1 },
  { text_en: 'Supplying new and pre-owned aircraft in accordance with international standards.', text_ar: 'توريد الطائرات الجديدة والمستعملة وفق المواصفات العالمية.', display_order: 2 },
  { text_en: 'Supplying and maintaining original aircraft spare parts and equipment.', text_ar: 'توريد وصيانة معدات وقطع غيار الطائرات الأصلية.', display_order: 3 },
  { text_en: 'Providing Ground Support Equipment (GSE) for airports.', text_ar: 'توريد معدات الدعم الأرضي للمطارات (Ground Support Equipment – GSE).', display_order: 4 },
  { text_en: 'Supplying Jet A-1 aviation fuel and developing its storage and distribution facilities.', text_ar: 'توريد وقود الطائرات (Jet A-1) وإنشاء مرافق تخزينه وتوزيعه.', display_order: 5 },
  { text_en: 'Planning, designing, constructing, and upgrading international, regional, and domestic airports.', text_ar: 'إنشاء وتطوير المطارات الدولية والإقليمية والمحلية.', display_order: 6 },
  { text_en: 'Designing and constructing passenger departure and arrival terminals to the latest international specifications.', text_ar: 'تصميم وبناء صالات السفر والوصول والمغادرة بأحدث المواصفات العالمية.', display_order: 7 },
  { text_en: 'Building air traffic control towers and air navigation centers.', text_ar: 'إنشاء أبراج المراقبة الجوية ومراكز الملاحة الجوية.', display_order: 8 },
  { text_en: 'Constructing runways, taxiways, and aircraft parking aprons.', text_ar: 'إنشاء المدارج وممرات الإقلاع والهبوط وساحات وقوف الطائرات.', display_order: 9 },
  { text_en: 'Building aircraft hangars.', text_ar: 'إنشاء حظائر الطائرات (Aircraft Hangars).', display_order: 10 },
  { text_en: 'Establishing aircraft Maintenance, Repair & Overhaul (MRO) centers.', text_ar: 'إنشاء مراكز صيانة وإصلاح وعمرة الطائرات (MRO).', display_order: 11 },
  { text_en: 'Implementing air navigation, radar, and communication system projects.', text_ar: 'تنفيذ مشاريع أنظمة الملاحة الجوية والرادارات والاتصالات.', display_order: 12 },
  { text_en: 'Supplying and installing airport security, safety, and smart surveillance systems.', text_ar: 'توريد وتركيب أنظمة الأمن والسلامة والمراقبة الذكية بالمطارات.', display_order: 13 },
  { text_en: 'Implementing baggage handling, air cargo, and logistics service systems.', text_ar: 'تنفيذ أنظمة مناولة الأمتعة والشحن الجوي والخدمات اللوجستية.', display_order: 14 },
  { text_en: 'Establishing logistics villages, air cargo zones, and free zones.', text_ar: 'إنشاء القرى اللوجستية ومناطق الشحن الجوي والمناطق الحرة.', display_order: 15 },
  { text_en: 'Managing and operating airports in partnership with governments and the private sector (PPP).', text_ar: 'إدارة وتشغيل المطارات بالشراكة مع الحكومات والقطاع الخاص (PPP).', display_order: 16 },
  { text_en: 'Establishing and managing airline companies.', text_ar: 'تأسيس وإدارة وتشغيل شركات الطيران.', display_order: 17 },
  { text_en: 'Providing technical, engineering, and management consultancy for aviation and airport projects.', text_ar: 'تقديم الاستشارات الفنية والهندسية والإدارية لمشروعات الطيران والمطارات.', display_order: 18 },
  { text_en: 'Representing global manufacturers of aircraft, engines, and related equipment.', text_ar: 'تمثيل الشركات العالمية المصنعة للطائرات ومحركاتها ومعداتها.', display_order: 19 },
  { text_en: 'Investing in aviation and airport infrastructure projects.', text_ar: 'الاستثمار في مشاريع الطيران والبنية التحتية للمطارات.', display_order: 20 },
  { text_en: 'Developing airport cities and associated economic zones.', text_ar: 'تطوير المدن والمناطق الاقتصادية المرتبطة بالمطارات (Airport Cities).', display_order: 21 },
  { text_en: 'Delivering integrated solutions for civil and military aviation projects in compliance with applicable systems and regulations.', text_ar: 'تقديم حلول متكاملة لمشروعات الطيران المدني والعسكري وفق الأنظمة واللوائح المعمول بها.', display_order: 22 },
];
