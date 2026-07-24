// EmailJS config for the Contact form and Newsletter signup (see main.js).
// Fill these in from your EmailJS account at emailjs.com:
//   - EMAILJS_PUBLIC_KEY  from Account -> General
//   - EMAILJS_SERVICE_ID  from Email Services (the email account you connect)
//   - EMAILJS_TEMPLATE_ID from Email Templates (the message layout)
// Full walkthrough in SETUP-DASHBOARD.md, section 5.
const EMAILJS_PUBLIC_KEY = 'nnOro-mJNyF3wnTjt';
const EMAILJS_SERVICE_ID = 'service_fvwfjtl';
const EMAILJS_TEMPLATE_ID = 'template_mbb7tg9';

if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
} else if (typeof emailjs === 'undefined') {
  console.warn('EmailJS SDK failed to load.');
} else {
  console.warn('EmailJS is not configured yet. Edit emailjs-config.js with your EmailJS account values.');
}
