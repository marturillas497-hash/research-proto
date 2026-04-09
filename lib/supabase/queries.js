// lib/supabase/queries.js

export async function getFullProfile(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      departments (name, code),
      student_metadata!student_metadata_profile_id_fkey (
        id_number,
        adviser_id,
        year_level,
        section,
        adviser:adviser_id (full_name)
      )
    `)
    .eq('id', userId)
    .single();

  if (error || !data) {
    if (error) console.error("Profile Fetch Error:", error.message);
    return null;
  }

  const meta = data.student_metadata;

  return {
    ...data,
    department_name: data.departments?.name || 'N/A',
    department_code: data.departments?.code || 'N/A',
    student_id: meta?.id_number || 'N/A', 
    year_level: meta?.year_level || null,
    section: meta?.section || null,
    adviser_id: meta?.adviser_id || null,
    adviser_name: meta?.adviser?.full_name || null,
  };
}

/**
 * NEW: Fetches all approved research advisers for the assignment dropdown
 */
export async function getAdviserList(supabase) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'research_adviser')
    .eq('status', 'active'); // Only show advisers who aren't 'pending'

  if (error) {
    console.error("Fetch Advisers Error:", error.message);
    return [];
  }
  return data;
}

/**
 * NEW: Updates the student's assigned adviser in the metadata table
 */
export async function updateStudentAdviser(supabase, studentId, newAdviserId) {
  const { data, error } = await supabase
    .from('student_metadata')
    .update({ 
      adviser_id: newAdviserId === "" ? null : newAdviserId 
    })
    .eq('profile_id', studentId);

  if (error) {
    console.error("Update Adviser Error:", error.message);
    return { success: false, error };
  }
  return { success: true };
}