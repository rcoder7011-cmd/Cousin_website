/**
 * Designer Information & Configuration
 * 
 * Centralized configuration for Rajabul Saifi.
 * Update phone numbers and contact details here to reflect across the entire site.
 */

export const DESIGNER_INFO = {
  name: "Rajabul Saifi",
  title: "Interior Designer & Execution Specialist",
  tagline: "Over a decade of creating beautiful, functional, and thoughtfully designed spaces.",
  experience: "10+ Years Experience",
  yearsOfExperience: 10,
  bio: "With over 10 years of experience in interior design, Rajabul Saifi leads a hands-on studio with a dedicated team of master craftsmen, carpenters, and finishing technicians. We create refined residential and commercial interiors across Gurugram, Delhi, and Noida with direct on-site supervision, uncompromising attention to detail, and transparent execution.",
  
  // Service Areas
  serviceAreas: [
    "Gurugram",
    "Delhi",
    "Noida"
  ],

  // Contact Information
  contact: {
    phone: "+91 84498 02502",
    whatsappNumber: "918449802502",
    email: "enquiry@rajabulinteriors.com",
    location: "Delhi NCR, India"
  },

  // Core Value Propositions based on 10+ years of studio experience
  strengths: [
    {
      title: "10+ Years Proven Craft",
      description: "A decade of mastering turnkey interior execution, space planning, and custom joinery across premium Delhi NCR developments."
    },
    {
      title: "Direct Site Supervision",
      description: "No middlemen or unaccountable sub-contractors. Rajabul personally oversees daily work on-site from layout to handover."
    },
    {
      title: "In-House Master Craftsmen",
      description: "Dedicated master carpenters, false-ceiling artisans, painters, and electrical technicians working cohesively under one roof."
    },
    {
      title: "Transparent & Cost-Effective",
      description: "Direct labour management and authentic material sourcing ensure competitive pricing without compromising durability."
    }
  ]
};

/**
 * Helper to generate pre-filled WhatsApp click-to-chat links
 * @param {string} message - Optional pre-filled text message
 * @returns {string} - WhatsApp URL
 */
export function getWhatsAppUrl(message = "Hi Rajabul, I would like to enquire about interior design work for my space.") {
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${DESIGNER_INFO.contact.whatsappNumber}?text=${encodedMsg}`;
}
