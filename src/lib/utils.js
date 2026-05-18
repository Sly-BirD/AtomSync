import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes intelligently.
 * clsx handles conditional classes, twMerge resolves conflicts
 * (e.g., if you pass both "p-2" and "p-4", it keeps only "p-4").
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
