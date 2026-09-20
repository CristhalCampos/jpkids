'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Layers, UserCheck } from 'lucide-react';
import GroupCard from '@/components/ui/GroupCard';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface ClassDay {
  id: string;
  date: string;
  dayName: string;
  monthName: string;
  dayNum: number;
  groupId: string;
  groupNumber: number;
  onClick?: () => void;
  isToday: boolean;
  isTeacherGroup: boolean;
}

export default function SchedulePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [currentTrimester, setCurrentTrimester] = useState<any>(null);
  const [teacherGroups, setTeacherGroups] = useState<number[]>([]);
  const [groupsMap, setGroupsMap] = useState<{[key: string]: number}>({});
  const [currentMonthNum, setCurrentMonthNum] = useState<number>(0);

  useEffect(() => {
    async function fetchScheduleData() {
      try {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonthNumber = today.getMonth() + 1;
        setCurrentMonthNum(currentMonthNumber);

        // 1. Obtener todos los grupos
        const { data: groupsData } = await supabase.from('groups').select('id, number');
        const gMap: {[key: string]: number} = {};
        (groupsData || []).forEach(g => {
          gMap[g.id] = g.number;
        });
        setGroupsMap(gMap);

        // 2. Obtener grupos del profesor logueado
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: groupTeacherData } = await supabase
            .from('group_teacher')
            .select('group_id')
            .eq('teacher_id', user.id);

          if (groupTeacherData && groupTeacherData.length > 0) {
            setTeacherGroups(groupTeacherData.map(item => item.group_id));
          }
        }

        // 3. Obtener trimestres con meses y días
        const { data: trimestersData } = await supabase
          .from('schedule_trimester')
          .select(`
            id,
            year,
            number,
            title,
            schedule_month (
              id,
              number,
              month,
              schedule_day (
                id,
                date,
                day,
                group_id
              )
            )
          `)
          .order('year', { ascending: true });

        if (trimestersData && trimestersData.length > 0) {
          let matchedTrimester = trimestersData.find(t => {
            if (t.year !== currentYear) return false;
            return (t.schedule_month || []).some(m => m.number === currentMonthNumber);
          });

          if (!matchedTrimester) {
            matchedTrimester = trimestersData[trimestersData.length - 1];
          }

          setCurrentTrimester(matchedTrimester);
        }
      } catch (error) {
        console.error("Error al cargar el cronograma:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchScheduleData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Agrupar y ordenar clases del mes
  const getClassesByMonth = (monthItem: any) => {
    const allDays = monthItem.schedule_day || [];
    
    // ORDENAR: Primero mis clases, luego hoy, luego cronológicamente
    const sortedDays = [...allDays].sort((a, b) => {
      const aIsTeacher = teacherGroups.includes(Number(a.group_id));
      const bIsTeacher = teacherGroups.includes(Number(b.group_id));
      const aIsToday = a.date === todayStr;
      const bIsToday = b.date === todayStr;
      
      // Prioridad 1: Clases del profesor logueado
      if (aIsTeacher && !bIsTeacher) return -1;
      if (!aIsTeacher && bIsTeacher) return 1;
      
      // Prioridad 2: Clase de hoy
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      
      // Prioridad 3: Orden cronológico
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    return sortedDays.map(dayRecord => {
      const dObj = new Date(dayRecord.date + 'T00:00:00');
      const dayNum = dObj.getDate();
      const groupId = dayRecord.group_id;
      const groupNum = groupsMap[groupId] || groupId;
      
      return {
        id: dayRecord.id,
        date: dayRecord.date,
        dayName: dayRecord.day,
        monthName: monthItem.month,
        dayNum,
        groupId,
        groupNumber: groupNum,
        onClick: () => router.push(`/schedule/${dayRecord.id}`),
        isToday: dayRecord.date === todayStr,
        isTeacherGroup: teacherGroups.includes(Number(groupId))
      };
    });
  };

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-600" />
          Cronograma de clases
        </h1>
        <p className="text-sm text-slate-500">
          Las clases que te corresponden aparecen primero en azul. Haz clic para ver detalles.
        </p>
      </div>

      {currentTrimester ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              {currentTrimester.number}° Trimestre {currentTrimester.year} {currentTrimester.title ? `- ${currentTrimester.title}` : ''}
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              Trimestre Actual
            </span>
          </div>

          {currentTrimester.schedule_month && currentTrimester.schedule_month.length > 0 ? (
            <div className="space-y-8">
              {currentTrimester.schedule_month
                .sort((a: any, b: any) => a.number - b.number)
                .map((monthItem: any) => {
                  const classDays = getClassesByMonth(monthItem);
                  const isCurrentMonth = monthItem.number === currentMonthNum;
                  
                  return (
                    <div key={monthItem.id} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isCurrentMonth ? 'bg-blue-600' : 'bg-purple-600'}`}></span>
                          {monthItem.month}
                        </h3>
                        {isCurrentMonth && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <UserCheck className="w-3 h-3" />
                            Mes Actual
                          </span>
                        )}
                      </div>
                      
                      {classDays.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {classDays.map((classDay) => (
                            <div key={classDay.id} className="space-y-2">
                              {/* Fecha de la clase */}
                              <div className="flex items-center gap-2">
                                <h4 className={`text-sm font-bold ${classDay.isTeacherGroup ? 'text-blue-700' : 'text-slate-700'}`}>
                                  {classDay.dayName} {classDay.dayNum} {classDay.monthName.slice(0, 3).toUpperCase()}
                                </h4>
                                {classDay.isToday && (
                                  <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                    Próxima
                                  </span>
                                )}
                              </div>
                              
                              {/* GroupCard con las maestras de ese grupo */}
                              <GroupCard
                                title={`Grupo ${classDay.groupNumber}`}
                                groupId={classDay.groupId}
                                onClick={classDay.onClick}
                                isTeacherGroup={classDay.isTeacherGroup}
                                isToday={classDay.isToday}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic py-2 pl-4">
                          No hay clases programadas para este mes.
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-sm text-slate-400 text-center py-4">
              No hay meses registrados en este trimestre.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500 text-sm">
          No hay información disponible para el trimestre actual.
        </div>
      )}
    </div>
  );
}