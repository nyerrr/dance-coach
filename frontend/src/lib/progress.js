import { supabase } from "./supabase";

export async function saveProgress({ danceId, score }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("saveProgress: no logged-in user");
    return;
  }

  const { data: existing, error: selectError } = await supabase
    .from("user_progress")
    .select("id, best_score")
    .eq("user_id", user.id)
    .eq("dance_id", danceId)
    .maybeSingle();

  if (selectError) {
    console.error("saveProgress select error:", selectError);
    return;
  }

  if (existing) {
    const newBest = Math.max(existing.best_score, score);
    const { error } = await supabase
      .from("user_progress")
      .update({
        best_score: newBest,
        last_practiced_at: new Date().toISOString(),
        status: newBest >= 80 ? "expert" : newBest >= 50 ? "intermediate" : "beginner",
      })
      .eq("id", existing.id);
    if (error) console.error("saveProgress update error:", error);
  } else {
    const { error } = await supabase
      .from("user_progress")
      .insert({
        user_id: user.id,
        dance_id: danceId,
        best_score: score,
        last_practiced_at: new Date().toISOString(),
        status: score >= 80 ? "expert" : score >= 50 ? "intermediate" : "beginner",
      });
    if (error) console.error("saveProgress insert error:", error);
  }
}

export async function fetchProgress() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_progress")
    .select("*, dances(title, video_url, difficulty)")
    .eq("user_id", user.id)
    .order("last_practiced_at", { ascending: false });

  if (error) {
    console.error("fetchProgress error:", error);
    return [];
  }

  return data ?? [];
}