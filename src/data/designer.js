/**
 * Company & Studio Information Configuration
 * 
 * Official Company Details:
 * Company Name: Saifi Interior Hub
 * Official Domain: saifiinteriorhub.in
 * Industry: Interior Design and Interior Work
 * Company Experience: 10+ Years
 */

export const COMPANY_INFO = {
  name: "Saifi Interior Hub",
  legalName: "Saifi Interior Hub",
  founder: "Rajabul Saifi",
  title: "Interior Design & Interior Work",
  tagline: "Over a decade of creating beautiful, functional, and thoughtfully designed spaces.",
  domain: "saifiinteriorhub.in",
  websiteUrl: "https://saifiinteriorhub.in",
  experience: "10+ Years Experience",
  yearsOfExperience: 10,
  industry: "Interior Design and Interior Work",
  bio: "Saifi Interior Hub brings over 10 years of experience in interior design and interior work across Gurugram, Delhi, and Noida. Founded by Rajabul Saifi, our company operates with an in-house team of master craftsmen, carpenters, POP artisans, and finishing technicians, delivering bespoke residential and commercial spaces with direct on-site supervision, transparent execution, and lasting quality.",
  
  // Regional Service Areas
  serviceAreas: [
    "Gurugram",
    "Delhi",
    "Noida"
  ],

  // Official Contact Information
  contact: {
    phone: "+91 84498 02502",
    whatsappNumber: "918449802502",
    email: "saifiinteriorhub@gmail.com",
    location: "Delhi NCR, India",
    domain: "saifiinteriorhub.in"
  },

  // Company Key Milestones & Statistics (Showcased via GSAP)
  stats: [
    { value: 10, suffix: "+", label: "Years Experience", description: "Over a decade in interior design & execution" },
    { value: 150, suffix: "+", label: "Projects Delivered", description: "Residential & commercial spaces in Delhi NCR" },
    { value: 100, suffix: "%", label: "Direct Supervision", description: "Daily on-site oversight with zero middlemen" },
    { value: 3, suffix: " Regions", label: "Delhi NCR Coverage", description: "Active execution in Gurugram, Delhi, Noida" }
  ],

  // Core Value Propositions based on 10+ years of company experience
  strengths: [
    {
      title: "10+ Years of Industry Experience",
      description: "A proven decade of excellence in turnkey interior design, space planning, modular woodwork, and custom joinery."
    },
    {
      title: "Direct Site Supervision",
      description: "No middlemen or unaccountable sub-contractors. Saifi Interior Hub personally oversees daily execution on-site from layout to handover."
    },
    {
      title: "In-House Master Craftsmen",
      description: "Dedicated master carpenters, false-ceiling artisans, painters, and electrical technicians working cohesively under one roof."
    },
    {
      title: "Transparent & Cost-Effective",
      description: "Direct labour management and authentic material sourcing ensure competitive pricing without sacrificing build quality."
    }
  ]
};

// Aliased for backwards compatibility across existing components
export const DESIGNER_INFO = COMPANY_INFO;

/**
 * Helper to generate pre-filled WhatsApp click-to-chat links
 * @param {string} message - Pre-filled message
 * @returns {string} - WhatsApp URL
 */
export function getWhatsAppUrl(message = "Hi Saifi Interior Hub, I would like to enquire about interior design and interior work for my space.") {
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${COMPANY_INFO.contact.whatsappNumber}?text=${encodedMsg}`;
}
