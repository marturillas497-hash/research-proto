// app/adviser/page.js
'use client';

import { useState, useEffect } from 'react';

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
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Adviser Dashboard</h1>
      <p className="text-gray-600 mb-8">Monitoring students in your department</p>

      <div className="grid grid-cols-1 gap-6">
        {students.map((student) => (
          <div key={student.id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{student.full_name}</h3>
                <p className="text-sm text-gray-500">{student.student_id} | {student.year_level}-{student.section}</p>
              </div>
              <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                {student.similarity_reports?.length || 0} Reports Filed
              </span>
            </div>

            {student.similarity_reports?.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Latest Activity</p>
                {student.similarity_reports.slice(0, 2).map((report) => (
                  <div key={report.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="font-medium text-gray-700 line-clamp-1">{report.input_title}</span>
                    <div className="flex items-center space-x-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${
                        report.risk_level === 'RED' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {Math.round(report.similarity_score * 100)}% Similarity
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No reports submitted yet.</p>
            )}
          </div>
        ))}

        {!loading && students.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
            <p className="text-gray-500">No students found in your department.</p>
          </div>
        )}
      </div>
    </div>
  );
}