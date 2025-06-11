
export interface Participant {
  id: number;
  cognome: string;
  nome: string;
  genere: string;
  dataNascita: string;
  comuneNascita: string;
  provNascita: string;
  cittadinanza: string;
  codiceFiscale: string;
  titoloStudio: string;
  cellulare: string;
  email: string;
  comuneDomicilio: string;
  provDomicilio: string;
  indirizzo: string;
  cap: string;
  benefits: 'SI' | 'NO'; // Added benefits field
  caseManager: string; // Added case manager field
}

export interface Lesson {
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  location: 'Ufficio' | 'Online';
  hours: number;
}

export interface ParsedCalendar {
  startDate: Date | null;
  endDate: Date | null;
  totalHours: number;
  presenceHours: number;
  onlineHours: number;
  fadHours: number; // New: FAD hours excluding lunch break
  lessons: Lesson[];
}

export interface CourseData {
  // Step 1 data
  projectId: string;
  sectionId: string;
  courseName: string;
  location: string;
  mainTeacher: string;
  teacherCF: string;
  operation: string;
  calendar: string;
  
  // FAD specific data
  teacherEmail?: string;
  teacherPhone?: string;
  zoomData?: string; // Raw pasted Zoom data
  zoomLink?: string; // Parsed Zoom link
  zoomId?: string; // Parsed meeting ID
  zoomPasscode?: string; // Parsed passcode
  
  // Step 2 data
  participants: Participant[];
  
  // Processed data
  parsedCalendar: ParsedCalendar;
}
