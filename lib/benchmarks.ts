// National LTA pass rates & waiting times — Feb 25 / Jan 26 data
// Source: LTA official first-timer passing rates publication

export type Centre = "SSDC" | "BBDC" | "CDC" | "Private";
export type TestType = "BTT" | "FTT" | "Class 3" | "Class 3A" | "Class 2B" | "Class 2A" | "Class 2";

export interface Benchmark {
  centre: Centre;
  tested: number;
  passed: number;
  pct: number;
}

// First-time pass rates by test type and centre
export const FIRST_TIME_PASS_RATES: Record<TestType, Benchmark[]> = {
  "BTT": [
    { centre: "SSDC",    tested:  8181, passed:  7056, pct: 86 },
    { centre: "BBDC",    tested: 12096, passed: 11219, pct: 93 },
    { centre: "CDC",     tested: 17538, passed: 15094, pct: 86 },
    { centre: "Private", tested: 32099, passed: 21781, pct: 68 },
  ],
  "FTT": [
    { centre: "SSDC",    tested:  5499, passed:  4983, pct: 91 },
    { centre: "BBDC",    tested:  8299, passed:  8061, pct: 97 },
    { centre: "CDC",     tested: 11977, passed: 10249, pct: 86 },
    { centre: "Private", tested: 12561, passed:  9452, pct: 75 },
  ],
  "Class 3": [
    { centre: "SSDC",    tested: 3821, passed: 1538, pct: 40 },
    { centre: "BBDC",    tested: 3404, passed: 1601, pct: 47 },
    { centre: "CDC",     tested: 5234, passed: 1907, pct: 36 },
    { centre: "Private", tested: 7246, passed: 2088, pct: 29 },
  ],
  "Class 3A": [
    { centre: "SSDC",    tested: 2211, passed: 1137, pct: 51 },
    { centre: "BBDC",    tested: 5305, passed: 2810, pct: 53 },
    { centre: "CDC",     tested: 8630, passed: 3861, pct: 45 },
    { centre: "Private", tested: 9815, passed: 3406, pct: 35 },
  ],
  "Class 2B": [],
  "Class 2A": [],
  "Class 2":  [],
};

// Get centre average for a specific test type
export function getCentreAvg(testType: TestType, centre: string): number | null {
  const rows = FIRST_TIME_PASS_RATES[testType];
  return rows.find(r => r.centre === centre)?.pct ?? null;
}

// Private instructor national averages (the "Other Candidates" benchmark)
export const PRIVATE_INSTRUCTOR_AVG: Record<string, number> = {
  "3":  29,
  "3A": 35,
};

// Label an instructor's pass rate relative to the private instructor average
export function getBenchmarkLabel(pct: number, licenseClass: "3" | "3A", totalTested: number): {
  label: string;
  color: string;
  delta: number;
} {
  const avg = PRIVATE_INSTRUCTOR_AVG[licenseClass];
  const delta = pct - avg;

  if (totalTested < 15) {
    return { label: "Low volume", color: "text-gray-400", delta };
  }
  if (delta >= 20) return { label: "Top performer", color: "text-green-600", delta };
  if (delta >= 8)  return { label: "Above average",  color: "text-green-500", delta };
  if (delta >= -5) return { label: "Average",         color: "text-yellow-600", delta };
  return              { label: "Below average",  color: "text-red-500",   delta };
}

// Waiting times — latest month (Jan-26)
export interface WaitingTime {
  centre: Centre;
  months: number;
}

export const WAITING_TIMES_LATEST: Record<TestType | "RTT", WaitingTime[]> = {
  "BTT": [
    { centre: "SSDC", months: 0.9 },
    { centre: "BBDC", months: 0.3 },
    { centre: "CDC",  months: 0.2 },
  ],
  "FTT": [
    { centre: "SSDC", months: 0.5 },
    { centre: "BBDC", months: 0.3 },
    { centre: "CDC",  months: 0.2 },
  ],
  "RTT": [
    { centre: "SSDC", months: 0.5 },
    { centre: "BBDC", months: 0.4 },
    { centre: "CDC",  months: 0.6 },
  ],
  "Class 3": [
    { centre: "SSDC", months: 0.5 },
    { centre: "BBDC", months: 0.4 },
    { centre: "CDC",  months: 1.1 },
  ],
  "Class 3A": [
    { centre: "SSDC", months: 0.8 },
    { centre: "BBDC", months: 0.4 },
    { centre: "CDC",  months: 0.9 },
  ],
  "Class 2B": [
    { centre: "SSDC", months: 0.5 },
    { centre: "BBDC", months: 1.0 },
    { centre: "CDC",  months: 1.5 },
  ],
  "Class 2A": [
    { centre: "SSDC", months: 1.0 },
    { centre: "BBDC", months: 1.0 },
    { centre: "CDC",  months: 1.1 },
  ],
  "Class 2": [
    { centre: "SSDC", months: 0.7 },
    { centre: "BBDC", months: 1.2 },
    { centre: "CDC",  months: 1.7 },
  ],
};

export function waitColor(months: number): string {
  if (months <= 0.4) return "text-green-600 bg-green-50 border-green-200";
  if (months <= 0.8) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export function monthsToWeeks(months: number): string {
  const weeks = Math.round(months * 4.3);
  return weeks <= 1 ? "~1 week" : `~${weeks} weeks`;
}

export const DATA_PERIOD = "Feb 2025 – Jan 2026";
export const WAITING_PERIOD = "Jan 2026";
