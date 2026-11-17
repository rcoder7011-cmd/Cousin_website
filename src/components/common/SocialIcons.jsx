import React from 'react';
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaLinkedinIn,
  FaPinterestP
} from 'react-icons/fa';

export function InstagramIcon({ size = 18, className = '', ...props }) {
  return <FaInstagram size={size} className={className} aria-hidden="true" {...props} />;
}

export function FacebookIcon({ size = 18, className = '', ...props }) {
  return <FaFacebookF size={size} className={className} aria-hidden="true" {...props} />;
}

export function YoutubeIcon({ size = 18, className = '', ...props }) {
  return <FaYoutube size={size} className={className} aria-hidden="true" {...props} />;
}

export function LinkedinIcon({ size = 18, className = '', ...props }) {
  return <FaLinkedinIn size={size} className={className} aria-hidden="true" {...props} />;
}

export function PinterestIcon({ size = 18, className = '', ...props }) {
  return <FaPinterestP size={size} className={className} aria-hidden="true" {...props} />;
}
