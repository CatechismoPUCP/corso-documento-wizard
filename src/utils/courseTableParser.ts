/**
 * Course table parsing utilities for extracting lesson and course data.
 * Supports multiple input formats and handles automatic time calculation.
 */
import { Lesson, ParsedCalendar } from '@/types/course';

/**
 * Parses schedule text and extracts individual lessons with their details.
 * Supports two formats:
 * 1. New format: "Subject - DD/MM/YYYY HH:MM - HH:MM - Location"
 * 2. Legacy format: "DD/MM/YYYY HH:MM - HH:MM"
 * 
 * @param scheduleText - Raw schedule text with lessons separated by newlines
 * @returns Array of parsed lesson objects
 * 
 * @example
 * ```typescript
 * const schedule = "Math - 15/01/2024 09:00 - 12:00 - Ufficio\nScience - 16/01/2024 14:00 - 17:00 - Online";
 * const lessons = parseScheduleText(schedule);
 * // Returns: [{ subject: "Math", date: "15/01/2024", ... }, { subject: "Science", ... }]
 * ```
 */
export const parseScheduleText = (scheduleText: string): Lesson[] => {
  const lessons: Lesson[] = [];
  const lines = scheduleText.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    // New format: "Subject - DD/MM/YYYY HH:MM - HH:MM - Location"
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
      // Legacy format: "DD/MM/YYYY HH:MM - HH:MM"
      const dateTimeMatch = line.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if (dateTimeMatch) {
        const [, dateStr, startTime, endTime] = dateTimeMatch;
        const hours = calculateLessonHours(startTime, endTime, 'Ufficio');
        
        lessons.push({
          subject: 'Lezione', // Default subject for legacy format
          date: dateStr,
          startTime,
          endTime,
          location: 'Ufficio', // Default location for legacy format
          hours
        });
      }
    }
  });
  
  return lessons;
};

/**
 * Calculates the effective lesson duration in hours, accounting for lunch breaks.
 * Automatically subtracts lunch break time (13:00-14:00) when lessons span across it.
 * 
 * @param startTime - Lesson start time in HH:MM format
 * @param endTime - Lesson end time in HH:MM format
 * @param location - Lesson location (currently unused but kept for future extensions)
 * @returns Effective lesson duration in hours (decimal)
 * 
 * @example
 * ```typescript
 * // Lesson from 9:00 to 17:00 (spans lunch break)
 * const hours = calculateLessonHours("09:00", "17:00", "Ufficio");
 * // Returns: 7 hours (8 hours - 1 hour lunch break)
 * 
 * // Lesson from 14:00 to 17:00 (after lunch)
 * const hours2 = calculateLessonHours("14:00", "17:00", "Ufficio");
 * // Returns: 3 hours (no lunch break deduction)
 * ```
 */
export const calculateLessonHours = (startTime: string, endTime: string, location: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  
  // Handle lunch break deduction (13:00-14:00)
  if (startHour < 13 && endHour > 14) {
    // Lesson spans across lunch break - subtract 1 hour
    totalMinutes -= 60;
  } else if (startHour < 13 && endHour >= 13 && endHour <= 14) {
    // Lesson ends during lunch break - no deduction needed
    // The lesson naturally stops before/during lunch
  } else if (startHour >= 13 && startHour < 14) {
    // Lesson starts during lunch break - calculate from 14:00
    totalMinutes = (endHour * 60 + endMin) - (14 * 60);
  }
  
  // Ensure non-negative result and convert to hours
  return Math.max(0, totalMinutes / 60);
};

/**
 * Processes an array of lessons and calculates comprehensive calendar statistics.
 * Determines course duration, total hours, and breakdown by location type.
 * 
 * @param lessons - Array of lesson objects to analyze
 * @returns ParsedCalendar object with calculated statistics and date ranges
 * 
 * @example
 * ```typescript
 * const lessons = [
 *   { subject: "Math", date: "15/01/2024", startTime: "09:00", endTime: "12:00", location: "Ufficio", hours: 3 },
 *   { subject: "Science", date: "16/01/2024", startTime: "14:00", endTime: "17:00", location: "Online", hours: 3 }
 * ];
 * const calendar = calculateParsedCalendar(lessons);
 * // Returns: { startDate: Date(2024-01-15), endDate: Date(2024-01-16), totalHours: 6, ... }
 * ```
 */
export const calculateParsedCalendar = (lessons: Lesson[]): ParsedCalendar => {
  // Handle empty lessons array
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

  // Convert lesson dates to Date objects for comparison
  const dates = lessons.map(lesson => {
    const [day, month, year] = lesson.date.split('/').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
  });

  // Find course start and end dates
  const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Calculate total hours across all lessons
  const totalHours = lessons.reduce((sum, lesson) => sum + lesson.hours, 0);
  
  // Calculate hours by location type
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

/**
 * Interface for parsed course data extracted from course table.
 * Contains essential course information needed for document generation.
 */
export interface ParsedCourseData {
  /** Full course name/title */
  courseName: string;
  /** Project identifier */
  projectId: string;
  /** Section identifier */
  sectionId: string;
  /** Main instructor/teacher name */
  mainTeacher: string;
  /** Raw schedule text containing lesson dates and times */
  scheduleText: string;
  /** Number of billable/accountable hours */
  rendicontabileHours: number;
}

/**
 * Parses a course table (typically copied from Excel/spreadsheet) and extracts
 * structured course data. Handles tab-separated and space-separated formats.
 * 
 * Expected table format:
 * - Column 0: Course Name
 * - Column 1: Project ID
 * - Column 2: Section ID
 * - Column 3: Schedule (dates/times)
 * - Column 4: Teacher/Provider
 * - Column 9: Billable Hours
 * 
 * @param courseTable - Raw course table text (tab or space separated)
 * @returns Parsed course data object or null if parsing fails
 * 
 * @example
 * ```typescript
 * const tableText = "Course Name\tPROJ123\tSECT456\t15/01/2024 09:00-12:00\tJohn Doe\t...\t30";
 * const parsed = parseCourseTable(tableText);
 * // Returns: { courseName: "Course Name", projectId: "PROJ123", ... }
 * ```
 */
export const parseCourseTable = (courseTable: string): ParsedCourseData | null => {
  const lines = courseTable.trim().split('\n');
  if (lines.length < 2) {
    console.warn('Course table parsing failed: insufficient lines');
    return null;
  }

  // Find the data line (should not start with a date pattern)
  let dataLineIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.match(/^\d{2}\/\d{2}\/\d{4}/)) {
      dataLineIndex = i;
      break;
    }
  }

  if (dataLineIndex === -1) {
    console.warn('Course table parsing failed: no data line found');
    return null;
  }

  // Extract full data text from data line onwards
  let fullDataText = '';
  for (let i = dataLineIndex; i < lines.length; i++) {
    fullDataText += lines[i];
    if (i < lines.length - 1) fullDataText += '\n';
  }

  console.log('Extracted course data text:', fullDataText);

  // Split by tabs or multiple spaces to separate columns
  const allParts = fullDataText
    .split(/\t| {2,}/)
    .map(part => part.trim())
    .filter(part => part.length > 0);
  
  console.log(`Found ${allParts.length} data parts:`, allParts);

  if (allParts.length < 4) {
    console.error('Course table parsing failed: insufficient data parts found', allParts);
    return null;
  }

  // Extract course information from parsed parts
  const courseName = allParts[0] || '';
  const projectId = allParts[1] || '';
  const sectionId = allParts[2] || '';
  const scheduleText = allParts[3] || '';
  
  // Teacher/Provider is in column 4
  const mainTeacher = allParts.length > 4 ? allParts[4] || '' : '';
  
  // Billable hours are in column 9
  let rendicontabileHours = 0;
  if (allParts.length > 9) {
    const hoursText = allParts[9] || '';
    const hoursMatch = hoursText.match(/(\d+)/);
    if (hoursMatch) {
      rendicontabileHours = parseInt(hoursMatch[1], 10);
    }
  }

  // Log extracted data for debugging
  console.log('Parsed course data:', {
    courseName,
    projectId,
    sectionId,
    scheduleText,
    mainTeacher,
    rendicontabileHours
  });

  return {
    courseName,
    projectId,
    sectionId,
    mainTeacher,
    scheduleText,
    rendicontabileHours
  };
};
