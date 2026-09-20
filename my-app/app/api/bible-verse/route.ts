import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');
    const reference = searchParams.get('reference');

    if (!versionId || !reference) {
      return NextResponse.json(
        { error: 'Faltan parámetros: versionId y reference' },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUVERSION_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key no configurada en el servidor' },
        { status: 500 }
      );
    }

    // SENIOR: Llamamos a la API de YouVersion desde el servidor (sin CORS)
    const url = `https://api.youversionapi.com/v1/bibles/${versionId}/passages/${encodeURIComponent(reference)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de YouVersion API:', errorText);
      return NextResponse.json(
        { error: `Versículo no encontrado (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extraer el texto del versículo
    const verseText = data.content ||
      (data.verses && data.verses.length > 0 ? data.verses[0].content : reference);

    return NextResponse.json({
      text: verseText,
      version: versionId,
      reference: reference
    });

  } catch (error) {
    console.error('Error en API route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}