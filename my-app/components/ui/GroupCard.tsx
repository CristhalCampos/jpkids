'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import IndividualCard from './IndividualCard';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface GroupCardProps {
  title: string;
  groupId: string;
  onClick?: () => void;
  isTeacherGroup?: boolean;
  isToday?: boolean;
}

export default function GroupCard({ 
  title, 
  groupId, 
  onClick, 
  isTeacherGroup = false,
  isToday = false
}: GroupCardProps) {
  const supabase = createClient();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeachers() {
      const { data: groupTeachers } = await supabase
        .from('group_teacher')
        .select('teacher_id')
        .eq('group_id', groupId);
      
      if (!groupTeachers) {
        setLoading(false);
        return;
      }

      const teacherIds = groupTeachers.map(gt => gt.teacher_id);
      
      const { data: teachersData } = await supabase
        .from('teachers')
        .select('id, first_name, last_name, avatar_url')
        .in('id', teacherIds);

      setTeachers(teachersData || []);
      setLoading(false);
    }

    fetchTeachers();
  }, [groupId, supabase]);

  // Determinar el estilo del borde según el estado
  const getBorderClasses = () => {
    if (isTeacherGroup) {
      return 'border-blue-400 ring-1 ring-blue-400/30 bg-blue-50/20 hover:border-blue-500';
    }
    if (isToday) {
      return 'border-purple-400 ring-1 ring-purple-400/30 bg-purple-50/20 hover:border-purple-500';
    }
    return 'border-slate-200 hover:border-purple-300';
  };

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white border rounded-2xl p-5 shadow-xs cursor-pointer
        transition-all hover:shadow-md
        ${getBorderClasses()}
      `}
    >
      <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
        <span className={`w-1.5 h-6 rounded-full ${isTeacherGroup ? 'bg-blue-600' : 'bg-purple-600'}`}></span>
        {title}
      </h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
        </div>
      ) : teachers.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {teachers.map((teacher) => (
            <IndividualCard
              key={teacher.id}
              name={`${teacher.first_name} ${teacher.last_name}`.trim()}
              image={teacher.avatar_url || undefined}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic text-center py-2">
          Sin maestras asignadas
        </p>
      )}
    </div>
  );
}