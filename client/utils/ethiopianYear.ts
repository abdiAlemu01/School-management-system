/**
 * Ethiopian calendar utilities.
 *
 * The Ethiopian New Year (Enkutatash) falls on September 11 (Gregorian).
 *   Jan – Aug  →  ETH_YEAR = GREGORIAN_YEAR − 8
 *   Sep – Dec  →  ETH_YEAR = GREGORIAN_YEAR − 7
 */

export const getCurrentEthiopianYear = (): number => {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() - 7 : now.getFullYear() - 8;
};

/**
 * Returns an array of Ethiopian academic year strings (single year, newest first).
 * e.g. ["2018", "2017", "2016", …]
 */
export const generateEthiopianAcademicYears = (count: number): string[] => {
  const current = getCurrentEthiopianYear();
  return Array.from({ length: count }, (_, i) => String(current - i));
};

/**
 * Formats a stored academic year for display with the "E.C." suffix.
 * Handles:
 *   - Ethiopian single-year format  "2018"       →  "2018 E.C."
 *   - Legacy Gregorian range format "2025/2026"  →  "2018 E.C."
 */
export const formatEthiopianYear = (year: string | undefined): string => {
  if (!year || year === "N/A") return "N/A";
  if (year.includes("/")) {
    const first = parseInt(year.split("/")[0], 10);
    if (!isNaN(first)) return `${first - 7} E.C.`;
  }
  return `${year} E.C.`;
};
