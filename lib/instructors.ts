import { createClient } from "@/lib/supabase";

export interface Instructor {
  id: string;
  name: string;
  bio: string | null;
  specialties: string[];
  areas: string[];
  driving_centre: string | null;
  experience_years: number | null;
  rating: number | null;
  review_count: number;
  referral_topics: string[];
  contact_wa: string | null;
  contact_tg: string | null;
  verified: boolean;
}

export interface InstructorFilters {
  area?: string;
  driving_centre?: string;
  topic?: string;
}

export async function fetchInstructors(filters?: InstructorFilters): Promise<Instructor[]> {
  const supabase = createClient();
  let query = supabase
    .from("instructors")
    .select("*")
    .eq("verified", true)
    .order("rating", { ascending: false });

  if (filters?.area) {
    query = query.contains("areas", [filters.area]);
  }
  if (filters?.driving_centre) {
    query = query.eq("driving_centre", filters.driving_centre);
  }
  if (filters?.topic) {
    query = query.contains("specialties", [filters.topic]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Instructor[];
}

export async function fetchInstructor(id: string): Promise<Instructor | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("instructors")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Instructor;
}

export async function logInstructorConnect(
  instructorId: string,
  weakTopic: string | null,
  referredBy: "drivekaki" | "instructor" = "drivekaki"
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("instructor_matches").insert({
      student_user_id: user?.id ?? null,
      instructor_id: instructorId,
      weak_topic: weakTopic,
      referred_by: referredBy,
    });
  } catch {
    // non-fatal — don't block the connect action
  }
}

export async function registerInstructor(data: {
  name: string;
  email: string;
  phone: string;
  driving_centre: string;
  areas: string[];
  referral_topics: string[];
  bio: string;
}) {
  const supabase = createClient();
  const { error } = await supabase
    .from("instructor_registrations")
    .insert(data);
  if (error) throw error;
}

// All unique areas from current instructors (for filter dropdowns)
export const SINGAPORE_AREAS = [
  "Admiralty", "Ang Mo Kio", "Bedok", "Bishan", "Boon Lay",
  "Buangkok", "Buona Vista", "Clementi", "Hougang", "Jurong",
  "Pasir Ris", "Punggol", "Serangoon", "Sembawang",
  "Sengkang", "Tampines", "Toa Payoh", "Woodlands", "Yishun",
];

export const DRIVING_CENTRES = ["CDC", "BBDC", "SSDC", "Private"];
