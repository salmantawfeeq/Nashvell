// Static fallback for contact.html, used by contact-loader.js when Supabase is
// unreachable. Mirrors the rows in supabase/seed_contact.sql — keep in sync if
// the seed changes.

const CONTACT_PAGE_FALLBACK = {
  hero_tag_en: 'Get In Touch', hero_tag_ar: 'تواصل معنا',
  hero_title_en: 'Contact Us', hero_title_ar: 'اتصل بنا',
  hero_sub_en: "We'd love to hear from you. Reach out for partnerships, inquiries or support.",
  hero_sub_ar: 'يسعدنا أن نسمع منك. تواصل معنا للشراكات أو الاستفسارات أو الدعم.',
  hero_image_url: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1600',

  info_tag_en: 'Contact Information', info_tag_ar: 'معلومات التواصل',
  info_title_en: "Let's Talk", info_title_ar: 'لنتحدث',
  info_desc_en: 'Reach out to us through any of the following channels. Our team is ready to assist you.',
  info_desc_ar: 'تواصل معنا عبر أي من القنوات التالية. فريقنا جاهز لمساعدتك.',

  form_tag_en: 'Send a Message', form_tag_ar: 'أرسل رسالة',
  form_title_en: 'Contact Form', form_title_ar: 'نموذج التواصل',
  form_desc_en: 'Fill out the form below and our team will get back to you within 24 hours.',
  form_desc_ar: 'املأ النموذج أدناه وسيتواصل معك فريقنا خلال 24 ساعة.',

  label_name_en: 'Full Name *', label_name_ar: 'الاسم الكامل *',
  placeholder_name_en: 'Your full name', placeholder_name_ar: 'اسمك الكامل',
  label_email_en: 'Email Address *', label_email_ar: 'البريد الإلكتروني *',
  placeholder_email_en: 'you@example.com', placeholder_email_ar: 'you@example.com',
  label_phone_en: 'Phone Number', label_phone_ar: 'رقم الهاتف',
  placeholder_phone_en: '+966 5X XXX XXXX', placeholder_phone_ar: '+966 5X XXX XXXX',
  label_subject_en: 'Subject *', label_subject_ar: 'الموضوع *',
  subject_default_en: 'Select a subject', subject_default_ar: 'اختر موضوعًا',
  subject_inquiry_en: 'General Inquiry', subject_inquiry_ar: 'استفسار عام',
  subject_trade_en: 'Products & Trade', subject_trade_ar: 'المنتجات والتجارة',
  subject_tech_en: 'Technology Services', subject_tech_ar: 'خدمات التقنية',
  subject_investment_en: 'Investment Partnership', subject_investment_ar: 'شراكة استثمارية',
  subject_logistics_en: 'Logistics & Shipping', subject_logistics_ar: 'الخدمات اللوجستية والشحن',
  subject_media_en: 'Media & Press', subject_media_ar: 'الإعلام والصحافة',
  label_message_en: 'Message *', label_message_ar: 'الرسالة *',
  placeholder_message_en: 'Tell us how we can help you...', placeholder_message_ar: 'أخبرنا كيف يمكننا مساعدتك...',
  btn_submit_en: 'Send Message', btn_submit_ar: 'إرسال الرسالة',

  offices_tag_en: 'Our Locations', offices_tag_ar: 'مواقعنا',
  offices_title_en: 'Global Offices', offices_title_ar: 'مكاتبنا حول العالم',
};

const CONTACT_INFO_ITEMS_FALLBACK = [
  { icon: 'bi-geo-alt', label_en: 'Head Office', label_ar: 'المكتب الرئيسي', value_en: 'Kingdom of Saudi Arabia, Riyadh', value_ar: 'المملكة العربية السعودية، الرياض', display_order: 0 },
  { icon: 'bi-telephone', label_en: 'Phone (KSA)', label_ar: 'الهاتف (السعودية)', value_en: '+966 50 441 5254', value_ar: '+966 50 441 5254', display_order: 1 },
  { icon: 'bi-telephone', label_en: 'Phone (Sudan)', label_ar: 'الهاتف (السودان)', value_en: '+249 90 717 5005', value_ar: '+249 90 717 5005', display_order: 2 },
  { icon: 'bi-envelope', label_en: 'Email', label_ar: 'البريد الإلكتروني', value_en: 'qqsalah@hotmail.com', value_ar: 'qqsalah@hotmail.com', display_order: 3 },
  { icon: 'bi-globe2', label_en: 'Website', label_ar: 'الموقع الإلكتروني', value_en: 'www.nashvell.com', value_ar: 'www.nashvell.com', display_order: 4 },
];

const CONTACT_OFFICES_FALLBACK = [
  { icon: 'bi-building', title_en: 'Riyadh, Saudi Arabia', title_ar: 'الرياض، السعودية', office_label_en: 'Head Office', office_label_ar: 'المكتب الرئيسي', address_en: 'King Fahd District, Riyadh, KSA', address_ar: 'حي الملك فهد، الرياض، السعودية', phone: '+966 50 441 5254', display_order: 0 },
  { icon: 'bi-building', title_en: 'Khartoum, Sudan', title_ar: 'الخرطوم، السودان', office_label_en: 'Regional Office', office_label_ar: 'المكتب الإقليمي', address_en: 'Al-Mogran, Khartoum, Sudan', address_ar: 'المقرن، الخرطوم، السودان', phone: '+249 90 717 5005', display_order: 1 },
  { icon: 'bi-building', title_en: 'Port Sudan, Sudan', title_ar: 'بورتسودان، السودان', office_label_en: 'Logistics Hub', office_label_ar: 'المركز اللوجستي', address_en: 'Port Sudan Harbor, Sudan', address_ar: 'ميناء بورتسودان، السودان', phone: '+249 90 717 5005', display_order: 2 },
];
