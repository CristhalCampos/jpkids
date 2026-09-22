'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Minus, ArrowLeft, Save, Loader2, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
}

interface GroupState {
  group_id?: string; // Opcional si es un grupo completamente nuevo creado en el momento
  number: number;
  teacher_ids: string[];
}

export default function RedistributePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [existingGroups, setExistingGroups] = useState<{ id: string; number: number }[]>([]);
  const [groupsConfig, setGroupsConfig] = useState<GroupState[]>([]);

  // Estados para el modal de registrar nueva maestra
  const [showNewTeacherModal, setShowNewTeacherModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [creatingTeacher, setCreatingTeacher] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Obtener todas las maestras registradas EXCLUYENDO al líder de ministerio
        const { data: teachersData } = await supabase
          .from('teachers')
          .select('id, first_name, last_name, role')
          .neq('role', 'líder de ministerio') // <-- Filtro para no incluir al líder
          .order('first_name', { ascending: true });

        setAllTeachers(teachersData || []);

        // 2. Obtener los grupos existentes en la base de datos
        const { data: groupsData } = await supabase
          .from('groups')
          .select('id, number')
          .order('number', { ascending: true });

        if (groupsData) {
          setExistingGroups(groupsData);
          
          // Por defecto inicializamos con 3 grupos (o los primeros 3 que existan)
          const initialGroupsCount = Math.min(3, groupsData.length);
          const initialConfig: GroupState[] = [];

          for (let i = 0; i < initialGroupsCount; i++) {
            initialConfig.push({
              group_id: groupsData[i].id,
              number: groupsData[i].number,
              teacher_ids: []
            });
          }

          if (initialConfig.length === 0 && groupsData.length === 0) {
            initialConfig.push({ number: 1, teacher_ids: [] });
          }

          setGroupsConfig(initialConfig);
        }
      } catch (error) {
        console.error("Error al cargar datos para redistribución:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Manejar cambio de maestras en un grupo específico por índice
  const handleTeacherToggle = (index: number, teacherId: string) => {
    setGroupsConfig(prev =>
      prev.map((group, idx) => {
        if (idx === index) {
          const exists = group.teacher_ids.includes(teacherId);
          const updatedTeachers = exists
            ? group.teacher_ids.filter(id => id !== teacherId)
            : [...group.teacher_ids, teacherId];
          return { ...group, teacher_ids: updatedTeachers };
        }
        return group;
      })
    );
  };

  // Botón "+" para agregar un nuevo grupo
  const handleAddGroup = () => {
    setGroupsConfig(prev => {
      const nextNumber = prev.length + 1;
      // Si hay un grupo físico en la base de datos que coincida con este número, reutilizamos su ID
      const matchingGroup = existingGroups.find(g => g.number === nextNumber);

      return [
        ...prev,
        {
          group_id: matchingGroup ? matchingGroup.id : undefined,
          number: nextNumber,
          teacher_ids: []
        }
      ];
    });
  };

  // Botón "-" para quitar el último grupo
  const handleRemoveGroup = () => {
    if (groupsConfig.length <= 1) {
      alert("Debe haber al menos un grupo.");
      return;
    }
    setGroupsConfig(prev => prev.slice(0, prev.length - 1));
  };

  // Registrar nueva maestra rápidamente
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim()) return;

    setCreatingTeacher(true);
    try {
      const tempId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('teachers')
        .insert([
          {
            id: tempId,
            first_name: newFirstName,
            last_name: newLastName,
            role: 'maestra'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setAllTeachers(prev => [...prev, data]);
        setShowNewTeacherModal(false);
        setNewFirstName('');
        setNewLastName('');
      }
    } catch (error) {
      console.error("Error al crear maestra:", error);
      alert("Hubo un error al registrar la maestra.");
    } finally {
      setCreatingTeacher(false);
    }
  };

  // Guardar la nueva distribución histórica
  const handleSaveRedistribution = async () => {
    if (!confirm("¿Estás seguro de aplicar esta redistribución? Esto cerrará el periodo de asignación actual y registrará la nueva configuración.")) {
      return;
    }

    setSubmitting(true);
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Cerrar el periodo anterior de todas las asignaciones activas existentes
      const { error: updateError } = await supabase
        .from('group_teacher')
        .update({ valid_to: yesterdayStr })
        .is('valid_to', null);

      if (updateError) throw updateError;

      // 2. Procesar cada grupo configurado (si no tiene group_id en la BD, lo creamos primero en la tabla `groups`)
      const newRowsToInsert: any[] = [];

      for (const group of groupsConfig) {
        let targetGroupId = group.group_id;

        if (!targetGroupId) {
          // Si el grupo no existía en la tabla groups, lo insertamos
          const { data: newGroupData, error: groupError } = await supabase
            .from('groups')
            .insert([{ number: group.number }])
            .select('id')
            .single();

          if (groupError) throw groupError;
          targetGroupId = newGroupData.id;
        }

        // Agregar las relaciones para las maestras de este grupo
        group.teacher_ids.forEach(teacherId => {
          newRowsToInsert.push({
            group_id: targetGroupId,
            teacher_id: teacherId,
            valid_from: todayStr,
            valid_to: null
          });
        });
      }

      // 3. Insertar las nuevas relaciones en `group_teacher`
      if (newRowsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('group_teacher')
          .insert(newRowsToInsert);

        if (insertError) throw insertError;
      }

      alert("¡Redistribución guardada exitosamente!");
      router.push('/groups');
    } catch (error) {
      console.error("Error al guardar la redistribución:", error);
      alert("Ocurrió un error al guardar los cambios.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto pb-16 px-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/groups')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-purple-600" />
          Volver a Grupos
        </button>

        <Button
          onClick={() => setShowNewTeacherModal(true)}
          title="Registrar Nueva Maestra"
          variant="secondary"
          icon={<UserPlus className="w-4 h-4 text-purple-600" />}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Nueva Redistribución de Grupos</h1>
            <p className="text-sm text-slate-500 mt-1">
              Asigna las maestras a cada grupo. Al guardar, el sistema archivará la configuración anterior como historial y activará esta nueva distribución desde hoy.
            </p>
          </div>

          {/* Controles de más y menos grupos */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl">
            <span className="text-xs font-bold text-slate-600 px-2">Grupos: {groupsConfig.length}</span>
            <button
              type="button"
              onClick={handleRemoveGroup}
              disabled={groupsConfig.length <= 1}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-all shadow-xs"
              title="Quitar grupo"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleAddGroup}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-white cursor-pointer transition-all shadow-xs"
              title="Añadir grupo"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lista dinámica de Grupos */}
        <div className="space-y-6">
          {groupsConfig.map((group, index) => (
            <div key={index} className="border border-slate-200 bg-slate-50/50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  Grupo {group.number}
                </h3>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                  {group.teacher_ids.length} maestra(s) seleccionada(s)
                </span>
              </div>

              {/* Selector de maestras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allTeachers.map(teacher => {
                  const isSelected = group.teacher_ids.includes(teacher.id);
                  return (
                    <button
                      key={teacher.id}
                      type="button"
                      onClick={() => handleTeacherToggle(index, teacher.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">
                        {teacher.first_name} {teacher.last_name || ''}
                      </span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                        isSelected ? 'bg-white text-purple-600 border-white' : 'border-slate-300'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Botón de Guardar */}
        <div className="pt-4 flex justify-end">
          <Button
            onClick={handleSaveRedistribution}
            disabled={submitting}
            title={submitting ? "Guardando..." : "Aplicar Redistribución"}
            variant="primary"
            icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Modal para Registrar Nueva Maestra */}
      {showNewTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">Registrar Nueva Maestra</h3>
              <button
                onClick={() => setShowNewTeacherModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="Ej. María"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Apellido</label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Ej. Pérez"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Correo</label>
                <input
                  type="email"
                  value={`${newFirstName.toLowerCase()}.${newLastName.toLowerCase()}@jpkids.com`}
                  readOnly
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Fecha de cumpleaños</label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  onClick={() => setShowNewTeacherModal(false)}
                  title="Cancelar"
                  variant="secondary"
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={creatingTeacher}
                  title={creatingTeacher ? "Guardando..." : "Guardar Maestra"}
                  variant="primary"
                  className="flex-1"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}