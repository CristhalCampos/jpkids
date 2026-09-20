'use client';
import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Sparkles, ArrowLeft, Loader2, Download, Bible } from 'lucide-react';
import { pdf } from '@react-pdf/renderer'; // SENIOR: Importamos la función generadora
import ClassPDF from '@/components/schedule/ClassPDF';

// Versiones de la Biblia disponibles
const BIBLE_VERSIONS = [
  { id: 'ntv', name: 'Nueva Traducción Viviente (NTV)', lang: 'es' },
  { id: 'rvr1960', name: 'Reina-Valera 1960 (RVR1960)', lang: 'es' },
];

function ScheduleDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState(null);
  const [groupNumber, setGroupNumber] = useState(null);
  const [bibleVersion, setBibleVersion] = useState('ntv');
  const [bibleVerseData, setBibleVerseData] = useState(null);
  const [loadingVerse, setLoadingVerse] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    async function fetchDayDetail() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('schedule_day')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error || !data) {
          console.error("No se encontró la lección");
          return;
        }

        setDayData(data);

        if (data.group_id) {
          const { data: groupData } = await supabase
            .from('groups')
            .select('number')
            .eq('id', data.group_id)
            .maybeSingle();

          if (groupData) {
            setGroupNumber(groupData.number);
          }
        }

        // Cargar versículo con la versión por defecto (NTV)
        if (data.bible_verse) {
          await fetchBibleVerse(data.bible_verse, 'ntv');
        }
      } catch (err) {
        console.error("Error al obtener detalle del día:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDayDetail();
  }, [id, supabase]);

  // Función para parsear referencia bíblica (ej: "Juan 3:16" → {book: "juan", chapter: 3, verse: 16})
  const parseBibleReference = (reference) => {
    // Eliminar espacios extra y convertir a minúsculas
    const cleanRef = reference.trim().toLowerCase();
    
    // Patrón para detectar libro, capítulo y versículo
    // Ejemplos: "Juan 3:16", "Juan 3:16-18", "Salmo 23:1"
    const match = cleanRef.match(/^([a-záéíóúüñ\s]+?)\s+(\d+):(\d+)(?:-\d+)?$/);
    
    if (!match) {
      // Si no hay versículo específico, intentar solo libro y capítulo
      const matchChapter = cleanRef.match(/^([a-záéíóúüñ\s]+?)\s+(\d+)$/);
      if (matchChapter) {
        return {
          book: matchChapter[1].trim(),
          chapter: parseInt(matchChapter[2]),
          verse: 1 // Por defecto el primer versículo
        };
      }
      return null;
    }

    return {
      book: match[1].trim(),
      chapter: parseInt(match[2]),
      verse: parseInt(match[3])
    };
  };

  // Función para obtener versículo de la API
  const fetchBibleVerse = async (reference, version) => {
    setLoadingVerse(true);
    try {
      const parsed = parseBibleReference(reference);
      
      if (!parsed) {
        setBibleVerseData({ text: reference, version });
        setLoadingVerse(false);
        return;
      }

      // Construir URL de la API
      const url = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/${version}/books/${parsed.book}/chapters/${parsed.chapter}/verses/${parsed.version}.json`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Versículo no encontrado en esta versión');
      }
      
      const data = await response.json();
      
      // La API devuelve diferentes estructuras según la versión
      const verseText = data.verse || data.text || data.content || reference;
      
      setBibleVerseData({
        text: verseText,
        version: version.toUpperCase()
      });
    } catch (error) {
      console.error("Error cargando versículo:", error);
      setBibleVerseData({ text: reference, version: version.toUpperCase() });
    } finally {
      setLoadingVerse(false);
    }
  };

  // Cambiar versión de la Biblia
  const handleVersionChange = (e) => {
    const newVersion = e.target.value;
    setBibleVersion(newVersion);
    if (dayData?.bible_verse) {
      fetchBibleVerse(dayData.bible_verse, newVersion);
    }
  };

  // Generar PDF de la clase
  const handleDownloadPDF = async () => {
    if (!dayData) return;
    setGeneratingPDF(true);
    
    try {
      // 1. Generamos el documento PDF en memoria
      const blob = await pdf(
        <ClassPDF
          dayData={dayData}
          groupNumber={groupNumber}
          verseText={bibleVerseData?.text || dayData.bible_verse}
          version={bibleVersion}
        />
      ).toBlob();

      // 2. Creamos una URL temporal y forzamos la descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nombre del archivo seguro (sin caracteres especiales)
      const safeTheme = (dayData.theme || 'Clase').toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `jp-kids-${safeTheme}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 3. Liberamos memoria
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un error al generar el PDF. Intenta nuevamente.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!dayData) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Lección no encontrada</h2>
        <button
          onClick={() => router.push('/schedule')}
          className="text-blue-600 font-bold hover:underline"
        >
          Regresar al cronograma
        </button>
      </div>
    );
  }

  const dateObj = new Date(dayData.date + 'T00:00:00');
  const dayNum = dateObj.getDate();
  const monthName = dateObj.toLocaleString('es', { month: 'long' }).toUpperCase();

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-10">
      {/* Botón para volver y descargar PDF */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/schedule')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-purple-600" />
          Volver al Cronograma
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={generatingPDF}
          className="inline-flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/30 active:scale-95"
        >
          {generatingPDF ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Descargar PDF
            </>
          )}
        </button>
      </div>

      {/* Cabecera / Tema oficial */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
            {dayData.day} {dayNum} de {monthName} {groupNumber ? `• Grupo ${groupNumber}` : ''}
          </span>
        </div>

        <h2 className="text-2xl font-black text-slate-900">
          {dayData.theme || "Clase sin título"}
        </h2>

        {/* Tarjeta Versículo Clave con selector de versión */}
        <div className="border border-slate-200 bg-slate-50 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-600 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              Versículo Clave: {dayData.bible_verse}
            </span>
            
            <div className="flex items-center gap-2">
              {loadingVerse && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
              <select
                value={bibleVersion}
                onChange={handleVersionChange}
                disabled={loadingVerse}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {BIBLE_VERSIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <p className="text-base text-slate-700 italic font-medium leading-relaxed">
            &ldquo;{bibleVerseData?.text || "Cargando texto bíblico..."}&rdquo;
          </p>
          
          {bibleVerseData?.version && (
            <p className="text-[10px] text-slate-400 text-right">
              Versión: {bibleVerseData.version}
            </p>
          )}
        </div>
      </div>

      {/* Historia y Tema Bíblico */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          Historia y Tema Bíblico
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {dayData.theme
            ? `Para la sesión de hoy titulada "${dayData.theme}", profundizaremos en el pasaje bíblico asignado para extraer enseñanzas prácticas y de carácter aplicables en la vida diaria de los niños.`
            : "No hay una descripción detallada registrada para esta historia bíblica."}
        </p>
      </div>

      {/* Desarrollo de la Clase */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Desarrollo de la Clase
        </h3>

        <div className="space-y-4 border-l-2 border-slate-200 ml-3 pl-6">
          <div className="relative">
            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-purple-600 border-4 border-white shadow-xs"></span>
            <h4 className="font-bold text-slate-800 text-sm">Actividad Principal</h4>
            <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {dayData.main_activity || "Desarrollo del tema central y dinámica de enseñanza."}
            </p>
          </div>

          <div className="relative">
            <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-xs"></span>
            <h4 className="font-bold text-slate-800 text-sm">Actividad de Reforzamiento</h4>
            <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {dayData.reinforcement_activity || "Repaso interactivo y aplicación práctica con los niños."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
      </div>
    }>
      <ScheduleDetailContent />
    </Suspense>
  );
}