'use client';
import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Sparkles, ArrowLeft, Loader2, Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import ClassPDF from '@/components/schedule/ClassPDF';

// SENIOR: IDs oficiales de YouVersion para traducciones en español
const BIBLE_VERSIONS = [
  { id: '158', name: 'Nueva Versión Internacional (NVI)' },
  { id: '149', name: 'Reina-Valera 1960 (RVR1960)' },
  { id: '180', name: 'Nueva Traducción Viviente (NTV)' },
];

// SENIOR: Mapeo de nombres de libros en español a IDs numéricos de YouVersion
const YOUVERSION_BOOKS: { [key: string]: number } = {
  'génesis': 1, 'genesis': 1, 'exodo': 2, 'éxodo': 2, 'levitico': 3, 'levítico': 3,
  'numeros': 4, 'números': 4, 'deuteronomio': 5, 'josue': 6, 'josué': 6, 'jueces': 7,
  'rut': 8, '1 samuel': 9, '2 samuel': 10, '1 reyes': 11, '2 reyes': 12,
  '1 cronicas': 13, '1 crónicas': 13, '2 cronicas': 14, '2 crónicas': 14, 'esdras': 15,
  'nehemias': 16, 'nehemías': 16, 'ester': 17, 'job': 18, 'salmos': 19, 'salmo': 19,
  'proverbios': 20, 'eclesiastes': 21, 'eclesiastés': 21, 'cantares': 22, 'isaias': 23, 'isaías': 23,
  'jeremias': 24, 'jeremías': 24, 'lamentaciones': 25, 'ezequiel': 26, 'daniel': 27,
  'oseas': 28, 'joel': 29, 'amos': 30, 'amós': 30, 'abdias': 31, 'abdías': 31,
  'jonas': 32, 'jonás': 32, 'miqueas': 33, 'nahum': 34, 'nahúm': 34, 'habacuc': 35,
  'sofonias': 36, 'sofonías': 36, 'hageo': 37, 'zacarias': 38, 'zacarías': 38,
  'malaquias': 39, 'malaquías': 39, 'mateo': 40, 'marcos': 41, 'lucas': 42,
  'juan': 43, 'hechos': 44, 'romanos': 45, '1 corintios': 46, '2 corintios': 47,
  'galatas': 48, 'gálatas': 48, 'efesios': 49, 'filipenses': 50, 'colosenses': 51,
  '1 tesalonicenses': 52, '2 tesalonicenses': 53, '1 timoteo': 54, '2 timoteo': 55,
  'tito': 56, 'filemon': 57, 'filemón': 57, 'hebreos': 58, 'santiago': 59,
  '1 pedro': 60, '2 pedro': 61, '1 juan': 62, '2 juan': 63, '3 juan': 64,
  'judas': 65, 'apocalipsis': 66
};

interface BibleVerseData {
  text: string;
  version: string;
}

function ScheduleDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState<any>(null);
  const [groupNumber, setGroupNumber] = useState<number | null>(null);
  const [bibleVersion, setBibleVersion] = useState('180'); // 180 = NTV por defecto
  const [bibleVerseData, setBibleVerseData] = useState<BibleVerseData | null>(null);
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

        // Cargar versículo con la versión por defecto (NTV = 180)
        if (data.bible_verse) {
          console.log('📖 Iniciando carga de versículo desde BD:', data.bible_verse);
          await fetchBibleVerse(data.bible_verse, '180');
        } else {
          console.log('⚠️ No hay campo bible_verse en los datos de este día.');
        }
      } catch (err) {
        console.error("Error al obtener detalle del día:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDayDetail();
  }, [id, supabase]);

  // SENIOR: Parsea la referencia y devuelve el ID numérico del libro para YouVersion
  const parseBibleReference = (reference: string) => {
    console.log('🔍 Parseando referencia:', reference);
    const cleanRef = reference.trim().toLowerCase();
    
    // Patrón: "libro cap:vers" o "libro cap:vers-fin"
    const match = cleanRef.match(/^([a-záéíóúüñ\s]+?)\s+(\d+):(\d+)(?:-\d+)?$/);
    
    if (!match) {
      // Intentar solo libro y capítulo
      const matchChapter = cleanRef.match(/^([a-záéíóúüñ\s]+?)\s+(\d+)$/);
      if (matchChapter) {
        const bookName = matchChapter[1].trim();
        const bookId = YOUVERSION_BOOKS[bookName];
        console.log('📖 Coincidencia solo capítulo:', bookName, '-> ID:', bookId);
        return bookId ? { bookId, chapter: parseInt(matchChapter[2]), verse: 1 } : null;
      }
      console.log('❌ No se pudo hacer match con la referencia:', cleanRef);
      return null;
    }

    const bookName = match[1].trim();
    const bookId = YOUVERSION_BOOKS[bookName];
    console.log('📖 Libro encontrado:', bookName, '-> ID:', bookId);
    
    if (!bookId) {
      console.error('⚠️ El libro NO está en el mapeo YOUVERSION_BOOKS:', bookName);
      return null;
    }

    return {
      bookId,
      chapter: parseInt(match[2]),
      verse: parseInt(match[3])
    };
  };

  // SENIOR: Consulta la API oficial de YouVersion con logs de depuración
  const fetchBibleVerse = async (reference: string, versionId: string) => {
    console.log('🚀 Iniciando fetchBibleVerse. Referencia:', reference, 'Versión ID:', versionId);
    setLoadingVerse(true);
    try {
      const parsed = parseBibleReference(reference);
      
      if (!parsed) {
        console.error('❌ Error: parseBibleReference devolvió null para:', reference);
        setBibleVerseData({ text: reference, version: "Referencia no reconocida" });
        setLoadingVerse(false);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_YOUVERSION_API_KEY;
      if (!apiKey) {
        console.error('❌ FALTA LA VARIABLE DE ENTORNO: NEXT_PUBLIC_YOUVERSION_API_KEY');
        setBibleVerseData({ text: reference, version: "Falta API Key" });
        setLoadingVerse(false);
        return;
      }

      // SENIOR: El dominio oficial es api.youversionapi.com
      // Formato: /bibles/{bible_id}/passages/{book_id}.{chapter}.{verse}
      const url = `https://api.youversion.com/v1/bibles/${versionId}/passages/${parsed.bookId}.${parsed.chapter}.${parsed.verse}`;
      console.log('🌐 URL a consultar:', url);
      
      // SENIOR: La API Key va en los HEADERS, no en la URL
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Api-Key': apiKey,
          'Accept': 'application/json'
        }
      });
      
      console.log('📡 Respuesta de la API - Status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en la respuesta de la API:', errorText);
        throw new Error(`Versículo no encontrado (Status: ${response.status})`);
      }
      
      const data = await response.json();
      console.log('✅ Datos recibidos de la API:', data);
      
      // YouVersion devuelve el texto en 'data.content' o dentro de 'data.verses'
      const verseText = data.content || (data.verses && data.verses.length > 0 ? data.verses[0].content : reference);
      const versionName = BIBLE_VERSIONS.find(v => v.id === versionId)?.name || versionId;
      
      setBibleVerseData({
        text: verseText,
        version: versionName
      });
    } catch (error) {
      console.error("💥 Error cargando versículo de YouVersion:", error);
      setBibleVerseData({ text: reference, version: "No disponible" });
    } finally {
      setLoadingVerse(false);
    }
  };

  // Cambiar versión de la Biblia
  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVersion = e.target.value;
    console.log('🔄 Cambiando versión a:', newVersion);
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
      const blob = await pdf(
        <ClassPDF
          dayData={dayData}
          groupNumber={groupNumber}
          verseText={bibleVerseData?.text || dayData.bible_verse}
          version={bibleVerseData?.version || bibleVersion}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeTheme = (dayData.theme || 'Clase').toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `jp-kids-${safeTheme}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
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
        <div className="flex items-center">
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
                className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 cursor-pointer"
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