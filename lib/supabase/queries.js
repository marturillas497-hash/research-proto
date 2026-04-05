// lib/supabase/queries.js
export async function getFullProfile(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      departments (
        name,
        code
      )
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Error fetching normalized profile:", error.message);
    return null;
  }

  // Flatten the object for easier use in the UI
  return {
    ...data,
    department_name: data.departments?.name || 'Unassigned',
    department_code: data.departments?.code || 'N/A'
  };
}