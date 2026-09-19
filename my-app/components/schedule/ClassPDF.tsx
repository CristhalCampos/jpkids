import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, color: '#334155' },
  header: { borderBottomWidth: 2, borderBottomColor: '#9333ea', paddingBottom: 15, marginBottom: 20 },
  meta: { fontSize: 10, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  verseBox: { backgroundColor: '#faf5ff', borderLeftWidth: 4, borderLeftColor: '#9333ea', padding: 15, marginVertical: 20, borderRadius: 4 },
  verseRef: { fontSize: 10, fontWeight: 'bold', color: '#9333ea', marginBottom: 8, textTransform: 'uppercase' },
  verseText: { fontSize: 12, fontStyle: 'italic', color: '#475569', lineHeight: 1.6 },
  versionTag: { fontSize: 8, color: '#94a3b8', textAlign: 'right', marginTop: 5 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 25, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  activityBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 12, border: '1px solid #e2e8f0' },
  activityTitle: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 6 },
  activityText: { fontSize: 10, color: '#64748b', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }
});

interface ClassPDFProps {
  dayData: any;
  groupNumber: number | null;
  verseText: string;
  version: string;
}

export default function ClassPDF({ dayData, groupNumber, verseText, version }: ClassPDFProps) {
  const dateObj = new Date(dayData.date + 'T00:00:00');
  const dayNum = dateObj.getDate();
  const monthName = dateObj.toLocaleString('es', { month: 'long' }).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.meta}>
            {dayData.day} {dayNum} DE {monthName} {groupNumber ? `• GRUPO ${groupNumber}` : ''}
          </Text>
          <Text style={styles.title}>{dayData.theme || "Clase sin título"}</Text>
        </View>

        {/* Versículo Clave */}
        <View style={styles.verseBox}>
          <Text style={styles.verseRef}>Versículo Clave: {dayData.bible_verse}</Text>
          <Text style={styles.verseText}>"{verseText}"</Text>
          <Text style={styles.versionTag}>Versión: {version.toUpperCase()}</Text>
        </View>

        {/* Historia y Tema */}
        <View>
          <Text style={styles.sectionTitle}>Historia y Tema Bíblico</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.6, color: '#475569' }}>
            {dayData.theme
              ? `Para la sesión de hoy titulada "${dayData.theme}", profundizaremos en el pasaje bíblico asignado para extraer enseñanzas prácticas y de carácter aplicables en la vida diaria de los niños.` 
              : "No hay una descripción detallada registrada para esta historia bíblica."}
          </Text>
        </View>

        {/* Desarrollo de la Clase */}
        <View>
          <Text style={styles.sectionTitle}>Desarrollo de la Clase</Text>
          
          <View style={styles.activityBox}>
            <Text style={styles.activityTitle}>Actividad Principal</Text>
            <Text style={styles.activityText}>
              {dayData.main_activity || "Desarrollo del tema central y dinámica de enseñanza."}
            </Text>
          </View>

          <View style={styles.activityBox}>
            <Text style={styles.activityTitle}>Actividad de Reforzamiento</Text>
            <Text style={styles.activityText}>
              {dayData.reinforcement_activity || "Repaso interactivo y aplicación práctica con los niños."}
            </Text>
          </View>
        </View>

        {/* Pie de página */}
        <Text style={styles.footer} fixed>
          Generado el {new Date().toLocaleDateString('es-ES')}
        </Text>
      </Page>
    </Document>
  );
}