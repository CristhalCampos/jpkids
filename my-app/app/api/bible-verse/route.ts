import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');
    const reference = searchParams.get('reference');

    console.log('🔵 [API Route] Recibiendo petición:', { versionId, reference });

    if (!versionId || !reference) {
      console.error('❌ [API Route] Faltan parámetros');
      return NextResponse.json(
        { error: 'Faltan parámetros: versionId y reference' },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUVERSION_API_KEY;
    console.log('🔑 [API Route] API Key configurada:', apiKey ? 'SÍ' : 'NO');
    
    if (!apiKey) {
      console.error(' [API Route] YOUVERSION_API_KEY no está definida en .env.local');
      return NextResponse.json(
        { error: 'API Key no configurada en el servidor' },
        { status: 500 }
      );
    }

    // SENIOR: Usamos el endpoint correcto de YouVersion
    const url = `https://api.youversion.com/v1/bibles/${versionId}/passages/${encodeURIComponent(reference)}`;
    console.log('🌐 [API Route] Consultando YouVersion:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Accept': 'application/json'
      }
    });

    console.log('📡 [API Route] Respuesta de YouVersion:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API Route] Error de YouVersion:', response.status, errorText);
      return NextResponse.json(
        { error: `Versículo no encontrado (${response.status})`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [API Route] Datos recibidos de YouVersion:', JSON.stringify(data, null, 2));
    
    // Extraer el texto del versículo - YouVersion devuelve diferentes estructuras
    let verseText = reference;
    
    if (data.content) {
      verseText = data.content;
    } else if (data.verses && Array.isArray(data.verses) && data.verses.length > 0) {
      verseText = data.verses.map((v: any) => v.content).join(' ');
    } else if (data.verses && data.verses[0] && data.verses[0].content) {
      verseText = data.verses[0].content;
    }

    console.log(' [API Route] Texto extraído:', verseText);

    return NextResponse.json({
      text: verseText,
      version: versionId,
      reference: reference
    });

  } catch (error) {
    console.error('💥 [API Route] Error interno:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}