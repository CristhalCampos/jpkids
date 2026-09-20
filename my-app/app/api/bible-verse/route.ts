import { NextResponse } from 'next/server';

// SENIOR: Mapeo de IDs numéricos (que viene del frontend) a códigos USFM de YouVersion
const BOOK_ID_TO_USFM: { [key: number]: string } = {
  1: 'GEN', 2: 'EXO', 3: 'LEV', 4: 'NUM', 5: 'DEU',
  6: 'JOS', 7: 'JDG', 8: 'RUT', 9: '1SA', 10: '2SA',
  11: '1KI', 12: '2KI', 13: '1CH', 14: '2CH', 15: 'EZR',
  16: 'NEH', 17: 'EST', 18: 'JOB', 19: 'PSA', 20: 'PRO',
  21: 'ECC', 22: 'SNG', 23: 'ISA', 24: 'JER', 25: 'LAM',
  26: 'EZK', 27: 'DAN', 28: 'HOS', 29: 'JOL', 30: 'AMO',
  31: 'OBA', 32: 'JON', 33: 'MIC', 34: 'NAM', 35: 'HAB',
  36: 'ZEP', 37: 'HAG', 38: 'ZEC', 39: 'MAL', 40: 'MAT',
  41: 'MRK', 42: 'LUK', 43: 'JHN', 44: 'ACT', 45: 'ROM',
  46: '1CO', 47: '2CO', 48: 'GAL', 49: 'EPH', 50: 'PHP',
  51: 'COL', 52: '1TH', 53: '2TH', 54: '1TI', 55: '2TI',
  56: 'TIT', 57: 'PHM', 58: 'HEB', 59: 'JAS', 60: '1PE',
  61: '2PE', 62: '1JN', 63: '2JN', 64: '3JN', 65: 'JUD',
  66: 'REV'
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');
    const reference = searchParams.get('reference');

    console.log('🔵 [API Route] Recibiendo petición:', { versionId, reference });

    if (!versionId || !reference) {
      return NextResponse.json(
        { error: 'Faltan parámetros: versionId y reference' },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUVERSION_API_KEY;
    if (!apiKey) {
      console.error('❌ YOUVERSION_API_KEY no configurada en .env.local');
      return NextResponse.json(
        { error: 'API Key no configurada en el servidor' },
        { status: 500 }
      );
    }

    // 1. Parsear la referencia para obtener bookId, chapter, verse
    // (Usamos la misma lógica de limpieza que en el frontend)
    const cleanRef = reference.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
    const match = cleanRef.match(/^([a-záéíóúüñ\s]+?)\s+(\d+):(\d+)(?:-\d+)?$/);
    
    let bookId = null;
    let chapter = 1;
    let verse = 1;

    if (match) {
      const bookName = match[1].trim();
      // Mapeo rápido de nombres comunes a IDs (simplificado para el backend)
      const nameToId: { [key: string]: number } = {
        'genesis': 1, 'exodo': 2, 'levitico': 3, 'numeros': 4, 'deuteronomio': 5,
        'josue': 6, 'jueces': 7, 'rut': 8, '1 samuel': 9, '2 samuel': 10,
        '1 reyes': 11, '2 reyes': 12, '1 cronicas': 13, '2 cronicas': 14, 'esdras': 15,
        'nehemias': 16, 'ester': 17, 'job': 18, 'salmos': 19, 'salmo': 19,
        'proverbios': 20, 'eclesiastes': 21, 'cantares': 22, 'isaias': 23, 'isaías': 23,
        'jeremias': 24, 'lamentaciones': 25, 'ezequiel': 26, 'daniel': 27,
        'oseas': 28, 'joel': 29, 'amos': 30, 'abdias': 31, 'jonas': 32,
        'miqueas': 33, 'nahum': 34, 'habacuc': 35, 'sofonias': 36, 'hageo': 37,
        'zacarias': 38, 'malaquias': 39, 'mateo': 40, 'marcos': 41, 'lucas': 42,
        'juan': 43, 'hechos': 44, 'romanos': 45, '1 corintios': 46, '2 corintios': 47,
        'galatas': 48, 'efesios': 49, 'filipenses': 50, 'colosenses': 51,
        '1 tesalonicenses': 52, '2 tesalonicenses': 53, '1 timoteo': 54, '2 timoteo': 55,
        'tito': 56, 'filemon': 57, 'hebreos': 58, 'santiago': 59,
        '1 pedro': 60, '2 pedro': 61, '1 juan': 62, '2 juan': 63, '3 juan': 64,
        'judas': 65, 'apocalipsis': 66
      };
      bookId = nameToId[bookName];
      chapter = parseInt(match[2]);
      verse = parseInt(match[3]);
    }

    if (!bookId) {
      console.error('❌ No se pudo identificar el libro en:', reference);
      return NextResponse.json({ error: 'Referencia bíblica no reconocida' }, { status: 400 });
    }

    // 2. SENIOR: Convertir bookId a código USFM
    const usfmCode = BOOK_ID_TO_USFM[bookId];
    if (!usfmCode) {
      console.error('❌ Book ID no encontrado en mapeo USFM:', bookId);
      return NextResponse.json({ error: 'Libro bíblico no reconocido' }, { status: 400 });
    }

    // 3. Construir URL con formato USFM correcto (ej: LUK.18.16)
    const passageId = `${usfmCode}.${chapter}.${verse}`;
    const url = `https://api.youversion.com/v1/bibles/${versionId}/passages/${passageId}`;
    
    console.log('🌐 [API Route] Consultando YouVersion:', url);
    console.log('📖 USFM:', passageId, '| Book ID:', bookId);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-yvpp-app-key': apiKey,
        'Accept': 'application/json'
      }
    });

    console.log('📡 [API Route] Respuesta:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error YouVersion:', response.status, errorText);
      return NextResponse.json(
        { error: `Versículo no encontrado (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Datos recibidos:', JSON.stringify(data, null, 2));
    
    // Extraer el texto del versículo
    let verseText = reference;
    if (data.content) {
      verseText = data.content;
    } else if (data.verses && Array.isArray(data.verses) && data.verses.length > 0) {
      verseText = data.verses.map((v: any) => v.content).join(' ');
    }

    const versionName = versionId === '158' ? 'NVI' : versionId === '149' ? 'RVR1960' : 'NTV';

    return NextResponse.json({
      text: verseText,
      version: versionName,
      reference: reference
    });

  } catch (error) {
    console.error('💥 Error interno en API Route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}