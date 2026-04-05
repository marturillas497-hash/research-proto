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
  const [availableAdvisers, setAvailableAdvisers] = useState([]);
  
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    email: '', 
    password: '', 
    full_name: '', 
    role: 'student',
    department_id: '', 
    adviser_id: '', // New optional field
    student_id: '', 
    year_level: '', 
    section: ''
  });

  // Load Departments on mount
  useEffect(() => {
    async function loadDepartments() {
      const { data } = await supabase
        .from('departments')
        .select('id, name, code')
        .order('name', { ascending: true });
      if (data) setDepartments(data);
    }
    loadDepartments();
  }, [supabase]);

  // Fetch Advisers when Department changes
  useEffect(() => {
    async function loadAdvisers() {
      if (!formData.department_id) {
        setAvailableAdvisers([]);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'research_adviser')
        .eq('department_id', formData.department_id)
        .eq('status', 'active'); // Only show verified advisers

      if (data) setAvailableAdvisers(data);
    }
    loadAdvisers();
  }, [formData.department_id, supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isRegistering) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
      } else {
        if (data.status === 'pending') {
          setError("Account pending approval.");
          setIsRegistering(false);
          setLoading(false);
        } else {
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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl border-b-4 border-slate-200">
        
        <h1 className="mb-8 text-3xl font-black text-center text-[#003366] tracking-tighter uppercase">
          {isRegistering ? 'Join Research' : 'Proto-Research'}
        </h1>

        {isRegistering && (
          <div className="relative flex p-1 mb-6 bg-slate-100 rounded-2xl">
            <div 
              className={`absolute top-1 bottom-1 w-[48%] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out z-0 ${
                formData.role === 'student' ? 'translate-x-0' : 'translate-x-[104%]'
              }`}
            />
            <button
              type="button"
              onClick={() => setFormData({...formData, role: 'student'})}
              className={`flex-1 py-3 text-xs font-black uppercase z-10 transition-colors ${
                formData.role === 'student' ? 'text-[#003366]' : 'text-slate-400'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, role: 'research_adviser'})}
              className={`flex-1 py-3 text-xs font-black uppercase z-10 transition-colors ${
                formData.role === 'research_adviser' ? 'text-[#003366]' : 'text-slate-400'
              }`}
            >
              Adviser
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 text-xs font-bold text-red-600 bg-red-50 border-l-4 border-red-600 rounded uppercase text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#003366] outline-none font-medium text-slate-700"
              required
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#003366] outline-none font-medium text-slate-700"
              required
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {isRegistering && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium text-slate-700"
                required
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
              
              {/* Department Dropdown */}
              <select 
                className="w-full p-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-[#003366]"
                required
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value, adviser_id: '' })}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.code} - {dept.name}</option>
                ))}
              </select>

              {formData.role === 'student' && (
                <div className="space-y-4">
                  {/* Adviser Dropdown (Optional & Filtered) */}
                  <select 
                    className={`w-full p-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#003366] ${
                      !formData.department_id ? 'opacity-50 cursor-not-allowed' : 'text-slate-600'
                    }`}
                    value={formData.adviser_id}
                    disabled={!formData.department_id}
                    onChange={(e) => setFormData({ ...formData, adviser_id: e.target.value })}
                  >
                    <option value="">Assigned Adviser (can be changed/added later)</option>
                    {availableAdvisers.map(adv => (
                      <option key={adv.id} value={adv.id}>{adv.full_name}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="ID Number"
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium"
                    required
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Year"
                      className="p-4 bg-slate-50 border-none rounded-2xl font-medium"
                      required
                      onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Section"
                      className="p-4 bg-slate-50 border-none rounded-2xl font-medium"
                      required
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 font-black text-[#003366] bg-[#FFCC00] rounded-2xl hover:brightness-105 active:scale-95 transition-all shadow-lg shadow-yellow-200/50 uppercase tracking-widest mt-4"
          >
            {loading ? 'Wait...' : isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full mt-8 text-[11px] font-black text-slate-400 hover:text-[#003366] uppercase tracking-[0.2em] transition-colors"
        >
          {isRegistering ? 'Back to Login' : 'Create New Account'}
        </button>
      </div>
    </div>
  );
}