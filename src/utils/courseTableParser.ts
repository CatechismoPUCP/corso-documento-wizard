import { Lesson, ParsedCalendar } from '@/types/course';

export const parseScheduleText = (scheduleText: string): Lesson[] => {
  const lessons: Lesson[] = [];
  const lines = scheduleText.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    // Nuovo formato: "Materia - DD/MM/YYYY HH:MM - HH:MM - Modalità"
    const newFormatMatch = line.match(/^(.+?)\s*-\s*(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*-\s*(Ufficio|Online)$/i);
    
    if (newFormatMatch) {
      const [, subject, dateStr, startTime, endTime, location] = newFormatMatch;
      const hours = calculateLessonHours(startTime, endTime, location);
      
      lessons.push({
        subject: subject.trim(),
        date: dateStr,
        startTime,
        endTime,
        location: location as 'Ufficio' | 'Online',
        hours
      });
    } else {
      // Formato vecchio: "DD/MM/YYYY HH:MM - HH:MM"
      const dateTimeMatch = line.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if (dateTimeMatch) {
        const [, dateStr, startTime, endTime] = dateTimeMatch;
        const hours = calculateLessonHours(startTime, endTime, 'Ufficio');
        
        lessons.push({
          subject: 'Lezione',
          date: dateStr,
          startTime,
          endTime,
          location: 'Ufficio', // Default per formato vecchio
          hours
        });
      }
    }
  });
  
  return lessons;
};

export const calculateLessonHours = (startTime: string, endTime: string, location: string): number => {
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  const startMin = parseInt(startTime.split(':')[1]);
  const endMin = parseInt(endTime.split(':')[1]);
  
  let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  
  // Sottrai pausa pranzo per TUTTE le lezioni che attraversano le 13:00-14:00
  // Se la lezione inizia prima delle 13:00 e finisce dopo le 14:00
  if (startHour < 13 && endHour > 14) {
    totalMinutes -= 60; // Sottrai 1 ora di pausa pranzo
  }
  // Se la lezione inizia prima delle 13:00 e finisce tra le 13:00 e le 14:00
  else if (startHour < 13 && endHour >= 13 && endHour <= 14) {
    // Non sottrarre nulla, la lezione finisce durante la pausa
  }
  // Se la lezione inizia tra le 13:00 e le 14:00
  else if (startHour >= 13 && startHour < 14) {
    // La lezione inizia durante la pausa, consideriamo che inizi alle 14:00
    totalMinutes = (endHour * 60 + endMin) - (14 * 60);
  }
  
  return Math.max(0, totalMinutes / 60);
};

export const calculateParsedCalendar = (lessons: Lesson[]): ParsedCalendar => {
  if (lessons.length === 0) {
    return {
      startDate: null,
      endDate: null,
      totalHours: 0,
      presenceHours: 0,
      onlineHours: 0,
      lessons: []
    };
  }

  const dates = lessons.map(lesson => {
    const [day, month, year] = lesson.date.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  });

  const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  const totalHours = lessons.reduce((sum, lesson) => sum + lesson.hours, 0);
  const presenceHours = lessons
    .filter(lesson => lesson.location === 'Ufficio')
    .reduce((sum, lesson) => sum + lesson.hours, 0);
  const onlineHours = lessons
    .filter(lesson => lesson.location === 'Online')
    .reduce((sum, lesson) => sum + lesson.hours, 0);

  return {
    startDate,
    endDate,
    totalHours,
    presenceHours,
    onlineHours,
    lessons
  };
};

export interface ParsedCourseData {
  courseName: string;
  projectId: string;
  sectionId: string;
  mainTeacher: string;
  scheduleText: string;
  rendicontabileHours: number;
}

export const parseCourseTable = (courseTable: string): ParsedCourseData | null => {
  const lines = courseTable.trim().split('\n');
  if (lines.length < 2) {
    return null;
  }

  // Trova la riga con i dati del corso (quella che inizia con il nome del corso)
  let dataLineIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Controlla se la riga contiene i dati del corso (non dovrebbe iniziare con una data)
    if (!line.match(/^\d{2}\/\d{2}\/\d{4}/)) {
      dataLineIndex = i;
      break;
    }
  }

  if (dataLineIndex === -1) {
    return null;
  }

  // Trova tutte le righe con date/orari per estrarre il calendario completo
  let fullDataText = '';
  for (let i = dataLineIndex; i < lines.length; i++) {
    fullDataText += lines[i];
    if (i < lines.length - 1) fullDataText += '\n';
  }

  console.log('Testo completo dati:', fullDataText);

  // Separa la riga principale dai dati usando tab o più spazi come separatori
  const allParts = fullDataText.split(/\t| {2,}/).map(part => part.trim()).filter(part => part.length > 0);
  console.log('Tutte le parti separate:', allParts.length, allParts);

  if (allParts.length < 4) {
    console.error('Parsing failed: Not enough parts found.', allParts);
    return null;
  }

  const courseName = allParts[0] || '';
  const projectId = allParts[1] || '';
  const sectionId = allParts[2] || '';
  
  // Il calendario è nella colonna 3, ma può contenere multiple date separate da newline
  const scheduleText = allParts[3] || '';
  
  // Il Provider è nella colonna 4
  let mainTeacher = '';
  if (allParts.length > 4) {
    mainTeacher = allParts[4] || '';
  }
  
  // Le ore rendicontabili sono nella colonna 9 (Rendicontabile)
  let rendicontabileHours = 0;
  if (allParts.length > 9) {
    const rendicontabileText = allParts[9] || '';
    const hoursMatch = rendicontabileText.match(/(\d+)/);
    if (hoursMatch) {
      rendicontabileHours = parseInt(hoursMatch[1]);
    }
  }

  console.log('Corso:', courseName);
  console.log('Project ID:', projectId);
  console.log('Section ID:', sectionId);
  console.log('Calendario estratto:', scheduleText);
  console.log('Docente trovato:', mainTeacher);
  console.log('Ore rendicontabili:', rendicontabileHours);

  return {
    courseName,
    projectId,
    sectionId,
    mainTeacher,
    scheduleText,
    rendicontabileHours
  };
};
