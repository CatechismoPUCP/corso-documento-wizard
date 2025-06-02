
import * as XLSX from 'xlsx';
import { CourseData } from '@/types/course';

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

    // Generate filename with section and course ID
    const filename = `calendario_lezioni_SEZ${data.sectionId}_CORSO${data.projectId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    
    console.log('Excel calendar generated successfully');
  } catch (error) {
    console.error('Error generating Excel calendar:', error);
    alert('Errore durante la generazione del calendario Excel.');
  }
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
