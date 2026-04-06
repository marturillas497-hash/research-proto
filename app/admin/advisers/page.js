// app/admin/advisers/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdviserDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      const res = await fetch('/api/adviser/students');
      const data = await res.json();
      if (!res.ok) console.error(data.error);
      else setStudents(data);
      setLoading(false);
    }
    loadStudents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10 min-h-screen bg-[#F0F0F0]">
      <div className="mb-12">
        <span className="bg-[#FFCC00] border-2 border-black px-3 py-1 text-[10px] font-black uppercase mb-4 inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          Adviser Portal
        </span>
        <h1 className="text-6xl font-black text-[#003366] tracking-tighter uppercase leading-none italic">
          Student Monitoring
        </h1>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
          {students.length} student{students.length !== 1 ? 's' : ''} assigned
        </p>
      </div>

      {loading ? (
        <div className="p-20 text-center font-black uppercase tracking-widest text-slate-300 animate-pulse">
          Loading students...
        </div>
      ) : students.length === 0 ? (
        <div className="border-4 border-dashed border-slate-300 p-24 text-center">
          <p className="font-black uppercase text-slate-300 text-lg tracking-widest">
            No students assigned yet
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {students.map((student) => (
            <div key={student.id} className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#003366] uppercase">{student.full_name}</h2>
                  <p className="text-xs font-black uppercase text-slate-400 mt-1">
                    {student.student_id} — {student.year_level} {student.section}
                  </p>
                </div>
                <span className={`border-4 border-black px-4 py-2 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  (student.similarity_reports?.length || 0) > 0
                    ? 'bg-[#FFCC00] text-black'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {student.similarity_reports?.length || 0} Reports
                </span>
              </div>

              {student.similarity_reports?.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b-2 border-slate-100 pb-2">
                    Latest Activity
                  </p>
                  {student.similarity_reports.slice(0, 2).map((report) => (
                    <Link
                      key={report.id}
                      href={`/adviser/report/${report.id}`}
                      className="flex justify-between items-center p-4 bg-slate-50 border-2 border-black hover:bg-[#FFCC00] transition-colors group"
                    >
                      <span className="font-black text-[#003366] uppercase text-sm truncate max-w-[60%] group-hover:text-black">
                        {report.input_title}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 border-2 border-black text-[10px] font-black ${
                          report.risk_level === 'RED'    ? 'bg-[#FF3333] text-white' :
                          report.risk_level === 'ORANGE' ? 'bg-[#FF9900] text-black' :
                          report.risk_level === 'YELLOW' ? 'bg-[#FFFF00] text-black' :
                                                           'bg-[#00FF66] text-black'
                        }`}>
                          {report.risk_level}
                        </span>
                        <span className="font-black text-[#003366] text-sm">
                          {Math.round((report.similarity_score || 0) * 100)}%
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-300 uppercase italic">
                  No reports submitted yet.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}