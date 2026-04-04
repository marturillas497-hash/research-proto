// app/login/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    email: '', password: '', full_name: '', role: 'student',
    department_id: '', student_id: '', year_level: '', section: ''
  });

  useEffect(() => {
    async function loadDepts() {
      const { data } = await supabase.from('departments').select('*').order('code');
      if (data) setDepartments(data);
    }
    loadDepts();
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isRegistering) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
      } else {
        if (data.status === 'pending') {
          setError("Account pending approval. Please wait for the admin.");
          setIsRegistering(false);
          setLoading(false);
        } else {
          // Trigger login after student registration
          const { error: LError } = await supabase.auth.signInWithPassword({
            email: formData.email, password: formData.password
          });
          if (!LError) router.refresh();
        }
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email, password: formData.password,
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        router.refresh();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border-t-8 border-[#003366]">
        <div className="flex justify-center mb-6">
          <div className="bg-[#003366] p-4 rounded-full text-[#FFCC00] font-black text-2xl">MIST</div>
        </div>
        
        <h1 className="mb-8 text-2xl font-bold text-center text-[#003366] uppercase tracking-tight">
          {isRegistering ? 'Research Enrollment' : 'Research Proto Login'}
        </h1>

        {error && (
          <div className="p-3 mb-6 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-[#003366] outline-none placeholder-slate-500 font-medium"
            required
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-[#003366] outline-none placeholder-slate-500 font-medium"
            required
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          {isRegistering && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <input
                type="text"
                placeholder="Full Name (Last, First M.)"
                className="w-full p-4 border-2 rounded-xl placeholder-slate-500 font-medium"
                required
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
              
              <select 
                className="w-full p-4 border-2 rounded-xl bg-white font-medium"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">Enroll as Student</option>
                <option value="research_adviser">Enroll as Faculty/Adviser</option>
              </select>

              <select 
                className="w-full p-4 border-2 rounded-xl bg-white font-medium"
                required
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                <option value="">Select Your Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>

              {formData.role === 'student' && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Student ID"
                    className="p-4 border-2 rounded-xl placeholder-slate-500 font-medium"
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Year & Section"
                    className="p-4 border-2 rounded-xl placeholder-slate-500 font-medium"
                    onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 font-black text-[#003366] bg-[#FFCC00] rounded-xl hover:bg-[#e6b800] active:scale-[0.98] transition-all shadow-md uppercase"
          >
            {loading ? 'Processing...' : isRegistering ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full mt-6 text-sm font-bold text-[#003366] hover:underline uppercase tracking-wide"
        >
          {isRegistering ? 'Already have an account? Log In' : 'New here? Create an Account'}
        </button>
      </div>
    </div>
  );
}