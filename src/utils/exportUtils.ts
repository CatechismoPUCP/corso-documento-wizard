
// This file has been refactored into specialized utility files:
// - attendanceExcelUtils.ts for attendance Excel generation
// - calendarExcelUtils.ts for calendar Excel generation  
// - otherExportsUtils.ts for Word reports and data exports

// Re-export for backward compatibility
export { generateAttendanceExcel } from './attendanceExcelUtils';
export { generateExcelCalendar } from './calendarExcelUtils';
export { generateWordReport, generateSampleData } from './otherExportsUtils';
