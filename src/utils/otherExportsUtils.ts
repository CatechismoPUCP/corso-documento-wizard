
import { CourseData } from '@/types/course';
import { generateWordDocument } from './wordTemplateUtils';
import { generateFADDocument } from './fadTemplateUtils';
import { generateAllConvocations } from './convocationUtils';

export const generateWordReport = async (data: CourseData) => {
  console.log('Generating Word report with data:', data);
  
  try {
    await generateWordDocument(data, 'calendario');
  } catch (error) {
    console.error('Error in generateWordReport:', error);
    // Fallback message for development
    alert('Per generare il documento Word, caricare il template in public/templates/calendario.docx');
  }
};

export const generateFADReport = async (data: CourseData) => {
  console.log('Generating FAD report with data:', data);
  
  try {
    await generateFADDocument(data);
  } catch (error) {
    console.error('Error in generateFADReport:', error);
    // Fallback message for development
    alert('Per generare il Modulo A FAD, caricare il template in public/templates/MODULO_A_FAD.docx');
  }
};

export const generateConvocations = async (data: CourseData) => {
  console.log('Generating convocations with data:', data);
  
  try {
    await generateAllConvocations(data);
  } catch (error) {
    console.error('Error in generateConvocations:', error);
    // Fallback message for development
    alert('Per generare le convocazioni, caricare il template in public/templates/CONVOCAZIONE.docx');
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
    fadData: {
      teacherEmail: data.teacherEmail,
      teacherPhone: data.teacherPhone,
      zoomLink: data.zoomLink,
      zoomId: data.zoomId,
      zoomPasscode: data.zoomPasscode,
      fadHours: data.parsedCalendar.fadHours
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
