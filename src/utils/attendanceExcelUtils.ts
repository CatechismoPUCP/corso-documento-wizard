
import * as XLSX from 'xlsx';
import { CourseData } from '@/types/course';

export const generateAttendanceExcel = (data: CourseData) => {
  console.log('Generating student attendance Excel with data:', data);
  
  try {
    if (data.participants.length === 0) {
      alert('Nessun partecipante trovato per generare il foglio presenze.');
      return;
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Create the data structure manually for better control
    const wsData: any[][] = [];
    
    // Header row with course info
    const headerRow = [
      'PROGETTO', 'SEZIONE', 'CORSO', 'INIZIO', 'FINE', 'CODICE', 'CODICE FISCALE', 
      'COGNOME NOME', 'CELLULARE', 'TELEFONO', 'EMAIL', 'DOCUMENTO', 'SCADENZA', 'CASE MANAGER', ''
    ];
    
    // Add lesson date headers with location and hours info
    data.parsedCalendar.lessons.forEach(lesson => {
      const locationLabel = lesson.location === 'Ufficio' ? 'Ufficio' : 'Online';
      headerRow.push(`${lesson.date} (${locationLabel} - ${lesson.hours}h)`);
    });
    headerRow.push('ORE TOTALI');
    
    wsData.push(headerRow);
    
    // Course info row
    const courseInfoRow = [
      data.projectId, data.sectionId, data.courseName, 
      data.parsedCalendar.startDate?.toLocaleDateString('it-IT') || '',
      data.parsedCalendar.endDate?.toLocaleDateString('it-IT') || '',
      '', '', '', '', '', '', '', '', '', ''
    ];
    
    // Add daily hours for each lesson
    data.parsedCalendar.lessons.forEach(lesson => {
      courseInfoRow.push(lesson.hours.toString());
    });
    courseInfoRow.push(''); // Total column
    
    wsData.push(courseInfoRow);
    
    // Empty row for spacing
    const emptyRow = new Array(headerRow.length).fill('');
    wsData.push(emptyRow);
    
    // Students data
    data.participants.forEach((participant, index) => {
      const studentRow: any[] = [
        data.projectId,
        data.sectionId, 
        data.courseName,
        data.parsedCalendar.startDate?.toLocaleDateString('it-IT') || '',
        data.parsedCalendar.endDate?.toLocaleDateString('it-IT') || '',
        participant.id.toString(),
        participant.codiceFiscale,
        `${participant.cognome} ${participant.nome}`,
        participant.cellulare,
        participant.cellulare,
        participant.email,
        '', // Document field
        '', // Expiry field
        participant.caseManager,
        ''  // Empty column
      ];
      
      // Add attendance columns for each lesson (initially empty for manual input)
      data.parsedCalendar.lessons.forEach(() => {
        studentRow.push(''); // Empty cell for attendance input
      });
      
      // Add Excel formula for total hours (will be calculated automatically)
      const startCol = 15; // Column P (0-indexed: A=0, B=1, ..., P=15)
      const endCol = startCol + data.parsedCalendar.lessons.length - 1;
      const rowNum = wsData.length + 1; // Excel row number (1-indexed)
      
      // Convert column numbers to Excel letters
      const getColumnLetter = (col: number) => {
        let result = '';
        while (col >= 0) {
          result = String.fromCharCode(65 + (col % 26)) + result;
          col = Math.floor(col / 26) - 1;
        }
        return result;
      };
      
      const startColLetter = getColumnLetter(startCol);
      const endColLetter = getColumnLetter(endCol);
      studentRow.push({ f: `SUM(${startColLetter}${rowNum}:${endColLetter}${rowNum})` });
      
      wsData.push(studentRow);
    });
    
    // Add daily totals row
    const dailyTotalsRow: any[] = new Array(15).fill('');
    dailyTotalsRow[7] = 'ORE TOTALI GIORNATA'; // In the name column
    
    data.parsedCalendar.lessons.forEach((_, index) => {
      const colIndex = 15 + index; // Starting from column P
      const colLetter = getColumnLetter(colIndex);
      const startRow = 4; // First student row (1-indexed)
      const endRow = 3 + data.participants.length; // Last student row
      dailyTotalsRow.push({ f: `SUM(${colLetter}${startRow}:${colLetter}${endRow})` });
    });
    
    // Total of totals
    const totalStartCol = 15;
    const totalEndCol = totalStartCol + data.parsedCalendar.lessons.length - 1;
    const totalRowNum = wsData.length + 1;
    const totalStartColLetter = getColumnLetter(totalStartCol);
    const totalEndColLetter = getColumnLetter(totalEndCol);
    dailyTotalsRow.push({ f: `SUM(${totalStartColLetter}${totalRowNum}:${totalEndColLetter}${totalRowNum})` });
    
    wsData.push(dailyTotalsRow);
    
    // Add progressive totals row
    const progressiveRow: any[] = new Array(15).fill('');
    progressiveRow[7] = 'ORE PROGRESSIVE';
    
    data.parsedCalendar.lessons.forEach((_, index) => {
      const colIndex = 15 + index;
      const colLetter = getColumnLetter(colIndex);
      const currentRowNum = wsData.length; // Current row for daily totals
      
      if (index === 0) {
        // First progressive = first daily total
        progressiveRow.push({ f: `${colLetter}${currentRowNum}` });
      } else {
        // Progressive = previous progressive + current daily total
        const prevColLetter = getColumnLetter(colIndex - 1);
        const nextRowNum = wsData.length + 1; // Next row (progressive row)
        progressiveRow.push({ f: `${prevColLetter}${nextRowNum}+${colLetter}${currentRowNum}` });
      }
    });
    progressiveRow.push(''); // No total for progressive
    
    wsData.push(progressiveRow);
    
    // Create worksheet from data
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    const colWidths = [
      { wch: 10 }, // PROGETTO
      { wch: 10 }, // SEZIONE
      { wch: 25 }, // CORSO
      { wch: 12 }, // INIZIO
      { wch: 12 }, // FINE
      { wch: 8 },  // CODICE
      { wch: 18 }, // CODICE FISCALE
      { wch: 25 }, // COGNOME NOME
      { wch: 15 }, // CELLULARE
      { wch: 15 }, // TELEFONO
      { wch: 25 }, // EMAIL
      { wch: 12 }, // DOCUMENTO
      { wch: 12 }, // SCADENZA
      { wch: 20 }, // CASE MANAGER
      { wch: 3 },  // Empty column
    ];
    
    // Add columns for each lesson date
    data.parsedCalendar.lessons.forEach(() => {
      colWidths.push({ wch: 15 }); // Wider for date + location + hours
    });
    colWidths.push({ wch: 12 }); // Total column
    
    ws['!cols'] = colWidths;
    
    // Freeze panes at row 4, column O (to keep headers visible)
    ws['!freeze'] = { xSplit: 14, ySplit: 3 };
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Registro Presenze');
    
    // Generate filename with section and course ID
    const filename = `registro_presenze_SEZ${data.sectionId}_CORSO${data.projectId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    
    console.log('Attendance Excel generated successfully');
  } catch (error) {
    console.error('Error generating attendance Excel:', error);
    alert('Errore durante la generazione del foglio presenze.');
  }
};

// Helper function to convert column numbers to Excel letters
const getColumnLetter = (col: number): string => {
  let result = '';
  while (col >= 0) {
    result = String.fromCharCode(65 + (col % 26)) + result;
    col = Math.floor(col / 26) - 1;
  }
  return result;
};
