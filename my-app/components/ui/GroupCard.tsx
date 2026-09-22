'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import IndividualCard from '@/components/ui/IndividualCard';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface GenericItem {
  name: string;
  image?: string;
  stars?: number;
  onClick?: () => void;
  isHighlighted?: boolean;
}

interface GroupCardProps {
  title: string;
  items?: GenericItem[];
  groupId?: string;
  onClick?: () => void;
  isTeacherGroup?: boolean;
  isToday?: boolean;
  classDate?: string; // <-- NUEVO: Para saber qué fecha evaluar históricamente
}

export default function GroupCard({
  title,
  items,
  groupId,
  onClick,
  isTeacherGroup = false,
  isToday = false,
  classDate
}: GroupCardProps) {
  const supabase = createClient();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items || !groupId) return;

    async function fetchTeachers() {
      setLoading(true);
      try {
        // Determinamos la fecha a evaluar (si no viene classDate, usamos el día de hoy en formato YYYY-MM-DD)
        const targetDate = classDate || new Date().toISOString().split('T')[0];

        // Consultamos la relación filtrando por el grupo
        const { data: groupTeachers, error } = await supabase
          .from('group_teacher')
          .select('teacher_id, valid_from, valid_to')
          .eq('group_id', groupId);

        if (error || !groupTeachers) {
          setLoading(false);
          return;
        }

        // Filtramos en memoria (o con la lógica de rangos) para quedarnos solo con las maestras vigentes en esa fecha
        const activeGroupTeachers = groupTeachers.filter(gt => {
          const from = gt.valid_from;
          const to = gt.valid_to ? gt.valid_to : '9999-12-31'; // Si valid_to es NULL, sigue vigente de forma indefinida
          return targetDate >= from && targetDate <= to;
        });

        const teacherIds = activeGroupTeachers.map(gt => gt.teacher_id);

        if (teacherIds.length === 0) {
          setTeachers([]);
          setLoading(false);
          return;
        }

        const { data: teachersData } = await supabase
          .from('teachers')
          .select('id, first_name, last_name, avatar_url')
          .in('id', teacherIds);

        setTeachers(teachersData || []);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeachers();
  }, [groupId, supabase, items, classDate]);

  const getBorderClasses = () => {
    if (isTeacherGroup) {
      return 'border-blue-400 ring-1 ring-blue-400/30 bg-blue-50/20 hover:border-blue-500';
    }
    if (isToday) {
      return 'border-purple-400 ring-1 ring-purple-400/30 bg-purple-50/20 hover:border-purple-500';
    }
    return 'border-slate-200 hover:border-purple-300';
  };

  const displayItems: GenericItem[] = items || teachers.map(t => ({
    name: `${t.first_name} ${t.last_name}`.trim(),
    image: t.avatar_url || undefined
  }));

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
      ) : displayItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {displayItems.map((item, index) => (
            <IndividualCard
              key={index}
              name={item.name}
              image={item.image}
              stars={item.stars}
              onClick={item.onClick}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic text-center py-2">
          Sin elementos asignados
        </p>
      )}
    </div>
  );
}