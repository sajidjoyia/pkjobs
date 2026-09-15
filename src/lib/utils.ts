import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Seats are optional: 0 / null / undefined means the advertisement did not
 * state a number of vacancies.
 */
export function formatSeats(seats: number | null | undefined): string {
  if (!seats || seats <= 0) return "Seats not specified";
  return `${seats} seat${seats > 1 ? "s" : ""}`;
}
