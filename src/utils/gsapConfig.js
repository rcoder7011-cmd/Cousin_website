import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register core plugins once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Check if the visitor prefers reduced motion
 * @returns {boolean}
 */
export function isReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Safe ScrollTrigger refresh utility
 */
export function refreshScrollTrigger() {
  if (typeof window !== 'undefined' && ScrollTrigger) {
    ScrollTrigger.refresh();
  }
}

export { gsap, ScrollTrigger };

