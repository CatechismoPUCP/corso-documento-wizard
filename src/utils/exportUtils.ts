import * as XLSX from 'xlsx';
import { CourseData } from '@/types/course';

export const generateWordReport = (data: CourseData) => {
  console.log('Generating Word report with data:', data);
  // TODO: Implement Word generation logic
  alert('Funzione Word Report in sviluppo');
};

export const generateAttendanceExcel = (data: CourseData) => {
  console.log('Generating student attendance Excel with data:', data);
  
  try {
    const { attendanceData, lessonDates } = generateAttendanceExcelData(data);
    
    if (attendanceData.length === 0) {
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
    
    // Add lesson date headers
    lessonDates.forEach(date => {
      headerRow.push(date);
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
    data.participants.forEach(participant => {
      const studentRow = [
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
      
      // Add formula for total hours
      const startCol = 15; // Column P (0-indexed: A=0, B=1, ..., P=15)
      const endCol = startCol + data.parsedCalendar.lessons.length - 1;
      const rowNum = wsData.length + 1; // Excel row number (1-indexed)
      const startColLetter = String.fromCharCode(65 + startCol); // Convert to letter
      const endColLetter = String.fromCharCode(65 + endCol);
      studentRow.push(`=SUM(${startColLetter}${rowNum}:${endColLetter}${rowNum})`);
      
      wsData.push(studentRow);
    });
    
    // Add daily totals row
    const dailyTotalsRow = new Array(15).fill('');
    dailyTotalsRow[7] = 'ORE TOTALI GIORNATA'; // In the name column
    
    data.parsedCalendar.lessons.forEach((_, index) => {
      const colIndex = 15 + index; // Starting from column P
      const colLetter = String.fromCharCode(65 + colIndex);
      const startRow = 4; // First student row (1-indexed)
      const endRow = 3 + data.participants.length; // Last student row
      dailyTotalsRow.push(`=SUM(${colLetter}${startRow}:${colLetter}${endRow})`);
    });
    
    // Total of totals
    const totalStartCol = 15;
    const totalEndCol = totalStartCol + data.parsedCalendar.lessons.length - 1;
    const totalRowNum = wsData.length + 1;
    const totalStartColLetter = String.fromCharCode(65 + totalStartCol);
    const totalEndColLetter = String.fromCharCode(65 + totalEndCol);
    dailyTotalsRow.push(`=SUM(${totalStartColLetter}${totalRowNum}:${totalEndColLetter}${totalRowNum})`);
    
    wsData.push(dailyTotalsRow);
    
    // Add progressive totals row
    const progressiveRow = new Array(15).fill('');
    progressiveRow[7] = 'ORE PROGRESSIVE';
    
    data.parsedCalendar.lessons.forEach((_, index) => {
      const colIndex = 15 + index;
      const colLetter = String.fromCharCode(65 + colIndex);
      const currentRowNum = wsData.length; // Current row for daily totals
      
      if (index === 0) {
        // First progressive = first daily total
        progressiveRow.push(`=${colLetter}${currentRowNum}`);
      } else {
        // Progressive = previous progressive + current daily total
        const prevColLetter = String.fromCharCode(65 + colIndex - 1);
        const nextRowNum = wsData.length + 1; // Next row (progressive row)
        progressiveRow.push(`=${prevColLetter}${nextRowNum}+${colLetter}${currentRowNum}`);
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
      colWidths.push({ wch: 10 });
    });
    colWidths.push({ wch: 12 }); // Total column
    
    ws['!cols'] = colWidths;
    
    // Freeze panes at row 4, column O (to keep headers visible)
    ws['!freeze'] = { xSplit: 14, ySplit: 3 };
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Registro Presenze');
    
    // Generate filename
    const filename = `registro_presenze_${data.sectionId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    
    console.log('Attendance Excel generated successfully');
  } catch (error) {
    console.error('Error generating attendance Excel:', error);
    alert('Errore durante la generazione del foglio presenze.');
  }
};

export const generateExcelCalendar = (data: CourseData) => {
  console.log('Generating Excel calendar with data:', data);
  
  try {
    // Create Excel data based on Python script logic
    const excelData = generateScheduleExcelData(data);
    
    if (excelData.length === 0) {
      alert('Nessuna lezione trovata per generare il calendario Excel.');
      return;
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set all columns to text format
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell_address = XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[cell_address]) continue;
        ws[cell_address].t = 's'; // Set type to string (text)
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Calendario Lezioni');

    // Generate filename
    const filename = `calendario_lezioni_${data.sectionId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    
    console.log('Excel calendar generated successfully');
  } catch (error) {
    console.error('Error generating Excel calendar:', error);
    alert('Errore durante la generazione del calendario Excel.');
  }
};

export const generateSampleData = (data: CourseData) => {
  const sampleData = {
    courseInfo: {
      projectId: data.projectId,
      sectionId: data.sectionId,
      courseName: data.courseName,
      location: data.location,
      mainTeacher: data.mainTeacher,
      teacherCF: data.teacherCF,
      operation: data.operation
    },
    calendar: data.parsedCalendar,
    participants: data.participants,
    generatedAt: new Date().toISOString()
  };

  console.log('Exporting complete data:', sampleData);

  const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `corso_${data.sectionId}_dati.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const generateScheduleExcelData = (data: CourseData) => {
  const excelData: any[] = [];

  data.parsedCalendar.lessons.forEach(lesson => {
    // Parse lesson date and times
    const [day, month, year] = lesson.date.split('/');
    const lessonDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const startTime = lesson.startTime;
    const endTime = lesson.endTime;
    
    // Convert times to hours for calculation
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    // Generate hourly blocks (like the Python script)
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      // Skip lunch break hour (13:00-14:00)
      if (currentHour === 13) {
        currentHour = 14;
        currentMin = 0;
        continue;
      }
      
      const nextHour = currentHour + 1;
      const blockEndHour = Math.min(nextHour, endHour);
      const blockEndMin = blockEndHour === endHour ? endMin : 0;
      
      // Format times
      const blockStart = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      const blockEnd = `${blockEndHour.toString().padStart(2, '0')}:${blockEndMin.toString().padStart(2, '0')}`;
      
      // Determine tipologia and svolgimento based on location
      const isOffice = lesson.location === 'Ufficio';
      const tipologia = isOffice ? '1' : '4';
      const svolgimentoSedeLezione = isOffice ? '1' : '';
      
      excelData.push({
        'ID_SEZIONE': data.sectionId,
        'DATA LEZIONE': lesson.date,
        'TOTALE_ORE': '1',
        'ORA_INIZIO': blockStart,
        'ORA_FINE': blockEnd,
        'TIPOLOGIA': tipologia,
        'CODICE FISCALE DOCENTE': data.teacherCF || '',
        'MATERIA': lesson.subject,
        'CONTENUTI MATERIA': lesson.subject,
        'SVOLGIMENTO SEDE LEZIONE': svolgimentoSedeLezione
      });
      
      currentHour = nextHour;
      currentMin = 0;
      
      // Break if we've reached the end time
      if (currentHour >= endHour && currentMin >= endMin) {
        break;
      }
    }
  });

  return excelData;
};

const generateAttendanceExcelData = (data: CourseData) => {
  // Get unique lesson dates
  const lessonDates = data.parsedCalendar.lessons.map(lesson => lesson.date);
  
  const attendanceData = data.participants.map(participant => {
    const baseInfo = {
      'Progetto': data.projectId,
      'Sezione': data.sectionId,
      'Corso': data.courseName,
      'Inizio': data.parsedCalendar.startDate?.toLocaleDateString('it-IT') || '',
      'Fine': data.parsedCalendar.endDate?.toLocaleDateString('it-IT') || '',
      'Codice': participant.id.toString(),
      'Codice Fiscale': participant.codiceFiscale,
      'Cognome Nome': `${participant.cognome} ${participant.nome}`,
      'Cellulare': participant.cellulare,
      'Telefono': participant.cellulare,
      'Email': participant.email,
      'Case Manager': participant.caseManager
    };

    // Add columns for each lesson date (empty for manual input)
    lessonDates.forEach(date => {
      baseInfo[date] = '';
    });

    return baseInfo;
  });

  return { attendanceData, lessonDates };
};
