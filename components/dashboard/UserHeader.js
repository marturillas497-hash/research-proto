// components/dashboard/UserHeader.js
export default function UserHeader({ profile }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black text-[#003366] tracking-tight">
          {profile.full_name}
        </h2>
        <div className="flex gap-2 mt-1">
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FFCC00] text-[#003366] rounded-full uppercase">
            {profile.role.replace('_', ' ')}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase">
            {profile.department_code} {/* Now shows "BSIS" instead of UUID */}
          </span>
        </div>
      </div>
      
      {profile.role === 'student' && (
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year & Section</p>
          <p className="font-bold text-[#003366]">{profile.year_level}</p>
        </div>
      )}
    </div>
  );
}