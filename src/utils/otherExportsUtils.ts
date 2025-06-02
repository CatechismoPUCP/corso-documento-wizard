
import { CourseData } from '@/types/course';

export const generateWordReport = (data: CourseData) => {
  console.log('Generating Word report with data:', data);
  // TODO: Implement Word generation logic
  alert('Funzione Word Report in sviluppo');
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
  a.download = `corso_SEZ${data.sectionId}_CORSO${data.projectId}_dati.json`;
  a.click();
  URL.revokeObjectURL(url);
};
