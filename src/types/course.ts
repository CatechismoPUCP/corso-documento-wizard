/**
 * Represents a course participant with all required personal and contact information.
 * Used for generating course documents and participant lists.
 */
export interface Participant {
  /** Unique identifier for the participant */
  id: number;
  /** Participant's last name */
  cognome: string;
  /** Participant's first name */
  nome: string;
  /** Participant's gender */
  genere: string;
  /** Birth date in DD/MM/YYYY format */
  dataNascita: string;
  /** Birth city */
  comuneNascita: string;
  /** Birth province code */
  provNascita: string;
  /** Participant's citizenship */
  cittadinanza: string;
  /** Italian fiscal code */
  codiceFiscale: string;
  /** Educational qualification */
  titoloStudio: string;
  /** Mobile phone number */
  cellulare: string;
  /** Email address */
  email: string;
  /** City of residence */
  comuneDomicilio: string;
  /** Province of residence */
  provDomicilio: string;
  /** Street address */
  indirizzo: string;
  /** Postal code */
  cap: string;
  /** Whether participant receives benefits */
  benefits: 'SI' | 'NO';
  /** Assigned case manager */
  caseManager: string;
}

/**
 * Represents a single lesson/class session within a course.
 */
export interface Lesson {
  /** Subject or topic of the lesson */
  subject: string;
  /** Date of the lesson in DD/MM/YYYY format */
  date: string;
  /** Start time in HH:MM format */
  startTime: string;
  /** End time in HH:MM format */
  endTime: string;
  /** Whether the lesson is in-person or online */
  location: 'Ufficio' | 'Online';
  /** Duration of the lesson in hours (calculated automatically) */
  hours: number;
}

/**
 * Contains parsed and calculated information from the course calendar.
 * This interface aggregates lesson data and provides summary statistics.
 */
export interface ParsedCalendar {
  /** First lesson date */
  startDate: Date | null;
  /** Last lesson date */
  endDate: Date | null;
  /** Total course hours across all lessons */
  totalHours: number;
  /** Hours for in-person lessons */
  presenceHours: number;
  /** Hours for online lessons */
  onlineHours: number;
  /** Array of all course lessons */
  lessons: Lesson[];
}

/**
 * Complete course data structure containing all information needed
 * for document generation. This is the main data model used throughout
 * the application workflow.
 */
export interface CourseData {
  // === Basic Course Information ===
  /** Project identifier */
  projectId: string;
  /** Section identifier */
  sectionId: string;
  /** Full course name/title */
  courseName: string;
  /** Primary course location */
  location: string;
  /** Main instructor name */
  mainTeacher: string;
  /** Teacher's fiscal code */
  teacherCF: string;
  /** Operation/program name */
  operation: string;
  /** Raw calendar text input */
  calendar: string;
  
  // === Participant Data ===
  /** List of enrolled participants */
  participants: Participant[];
  
  // === Processed Calendar Data ===
  /** Parsed and calculated calendar information */
  parsedCalendar: ParsedCalendar;

  // === Optional Zoom Meeting Data ===
  /** Zoom meeting link (optional) */
  linkZoom?: string;
  /** Zoom meeting ID (optional) */
  idRiunione?: string;
  /** Zoom meeting passcode (optional) */
  passcode?: string;
}
