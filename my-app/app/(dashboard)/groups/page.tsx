'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Layers, UserPlus, History, ShieldAlert } from 'lucide-react';
import GroupCard from '@/components/ui/GroupCard';
import Button from '@/components/ui/Button';

interface GroupAssignment {
  group_id: string;
  group_number: number;
  valid_from: string;
  valid_to: string | null;
  teacher_id: string;
}

export default function GroupsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);
  const [groupsMap, setGroupsMap] = useState<any[]>([]);
  const [historicalRecords, setHistoricalRecords] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');

  useEffect(() => {
    async function fetchGroupsAndRole() {
      try {
        // 1. Verificar el rol del usuario logueado
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: teacherData } = await supabase
            .from('teachers')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (teacherData && teacherData.role === 'líder de ministerio') {
            setIsLeader(true);
          }
        }

        // 2. Obtener la lista de grupos básicos ordenados por número
        const { data: groupsData } = await supabase
          .from('groups')
          .select('id, number')
          .order('number', { ascending: true });

        if (!groupsData) return;
        setGroupsMap(groupsData);

        // 3. Obtener todas las asignaciones de la tabla group_teacher con sus relaciones
        const { data: gtData } = await supabase
          .from('group_teacher')
          .select(`
            group_id,
            valid_from,
            valid_to,
            teachers (
              id,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .order('valid_from', { ascending: false });

        if (gtData) {
          setHistoricalRecords(gtData);
        }
      } catch (error) {
        console.error("Error al cargar los grupos y roles:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchGroupsAndRole();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Filtrar grupos actuales (los que tienen valid_to como null)
  const currentActiveAssignments = historicalRecords.filter(gt => gt.valid_to === null);

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto pb-10 px-4">
      {/* Cabecera y Botón de Nueva Distribución */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-600" />
            Distribución de Grupos y Maestras
          </h1>
          <p className="text-sm text-slate-500">
            Administra los equipos de trabajo actuales y consulta el registro histórico de asignaciones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón de cambio de vista Actual / Historial */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('current')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'current' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Actuales
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'history' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Historial
            </button>
          </div>

          {/* Botón para hacer nueva distribución (Protegido por rol) */}
          <Button
            {...(isLeader ? { href: "/groups/redistribute" } : { disabled: true, type: "button" })}
            title="Nueva Distribución"
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
          />
        </div>
      </div>

      {!isLeader && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 text-xs font-medium">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
          <span>
            El botón de <strong>Nueva Distribución</strong> está desactivado porque requiere rol de <em>líder de ministerio</em>.
          </span>
        </div>
      )}

      {/* Contenido según la vista seleccionada */}
      {viewMode === 'current' ? (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800">Grupos Activos (Vigentes)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupsMap
              .map(group => {
                // Extraer las maestras de este grupo cuyo valid_to sea null (actuales)
                const teachersInGroup = currentActiveAssignments
                  .filter(gt => gt.group_id === group.id && gt.teachers)
                  .map(gt => ({
                    name: `${gt.teachers.first_name} ${gt.teachers.last_name || ''}`.trim(),
                    image: gt.teachers.avatar_url
                  }));

                return {
                  ...group,
                  teachersInGroup
                };
              })
              // Filtramos para excluir los grupos que no tengan maestras asignadas actualmente
              .filter(group => group.teachersInGroup.length > 0)
              .map(group => (
                <GroupCard
                  key={group.id}
                  title={`Grupo ${group.number}`}
                  items={group.teachersInGroup}
                />
              ))}
          </div>

          {currentActiveAssignments.length === 0 && (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl text-slate-400 text-sm">
              No hay grupos con maestras asignadas actualmente.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Registro Histórico de Asignaciones</h2>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              Todos los periodos
            </span>
          </div>

          {/* Listado de registros históricos */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            {historicalRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Grupo ID</th>
                      <th className="py-3 px-4">Maestra</th>
                      <th className="py-3 px-4">Vigencia Desde</th>
                      <th className="py-3 px-4">Vigencia Hasta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600">
                    {historicalRecords.map((record, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          Grupo {groupsMap.find(g => g.id === record.group_id)?.number || record.group_id}
                        </td>
                        <td className="py-3 px-4 font-medium text-purple-700">
                          {record.teachers ? `${record.teachers.first_name} ${record.teachers.last_name || ''}` : 'Maestra eliminada'}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-emerald-600 bg-emerald-50/50 rounded-lg">
                          {record.valid_from}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold">
                          {record.valid_to ? (
                            <span className="text-rose-600 bg-rose-50/50 px-2 py-1 rounded">{record.valid_to}</span>
                          ) : (
                            <span className="text-blue-600 bg-blue-50/50 px-2 py-1 rounded">Actual (Indefinido)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8 text-sm">No hay registros históricos en el sistema.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}