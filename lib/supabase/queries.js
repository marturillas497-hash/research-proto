// lib/supabase/queries.js
export async function getFullProfile(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      departments (name, code),
      student_metadata!student_metadata_profile_id_fkey (
        lrn,
        adviser_id,
        year_level,
        section,
        adviser:adviser_id (full_name)
      )
    `)
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    department_name: data.departments?.name || 'N/A',
    department_code: data.departments?.code || 'N/A',
    student_id: data.student_metadata?.lrn || 'N/A',
    adviser_id: data.student_metadata?.adviser_id || null,
    adviser_name: data.student_metadata?.adviser?.full_name || null,
    year_level: data.student_metadata?.year_level || null,
    section: data.student_metadata?.section || null,
  };
}