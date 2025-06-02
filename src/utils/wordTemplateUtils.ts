
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { CourseData } from '@/types/course';

export interface WordTemplateData {
  // Page 1 placeholders
  ID_PROGETTO: string;
  ID_SEZIONE: string;
  NOME_CORSO: string;
  LOCATION: string;
  COURSE_START_DATE: string;
  COURSE_END_DATE: string;
  COURSE_DURATION: string;
  OPERATOR: string;
  TEACHER_NAME: string;
  TOTAL_PAGES: string;
  
  // Page 2 placeholders - participants (up to 20)
  USER_1?: string;
  USER_2?: string;
  USER_3?: string;
  USER_4?: string;
  USER_5?: string;
  USER_6?: string;
  USER_7?: string;
  USER_8?: string;
  USER_9?: string;
  USER_10?: string;
  USER_11?: string;
  USER_12?: string;
  USER_13?: string;
  USER_14?: string;
  USER_15?: string;
  USER_16?: string;
  USER_17?: string;
  USER_18?: string;
  USER_19?: string;
  USER_20?: string;
  
  // Dynamic lesson pages placeholders
  officeDays: Array<{
    LESSON_DAY: string;
    LESSON_MONTH: string;
    LESSON_YEAR: string;
    LESSON_DATE_FULL: string;
  }>;
}

export const generateWordTemplateData = (data: CourseData): WordTemplateData => {
  console.log('Generating Word template data:', data);
  
  // Filter only office days for dynamic pages
  const officeDays = data.parsedCalendar.lessons
    .filter(lesson => lesson.location === 'Ufficio')
    .map(lesson => {
      const lessonDate = new Date(lesson.date);
      return {
        LESSON_DAY: lessonDate.getDate().toString().padStart(2, '0'),
        LESSON_MONTH: (lessonDate.getMonth() + 1).toString().padStart(2, '0'),
        LESSON_YEAR: lessonDate.getFullYear().toString(),
        LESSON_DATE_FULL: lessonDate.toLocaleDateString('it-IT')
      };
    });

  // Calculate total pages: 2 base pages + (office days * 2)
  const totalPages = 2 + (officeDays.length * 2);

  // Prepare participant data (up to 20 slots)
  const participantData: { [key: string]: string } = {};
  data.participants.forEach((participant, index) => {
    if (index < 20) {
      const userKey = `USER_${index + 1}`;
      participantData[userKey] = `${participant.cognome} ${participant.nome}`;
    }
  });

  const templateData: WordTemplateData = {
    // Basic course information
    ID_PROGETTO: data.projectId,
    ID_SEZIONE: data.sectionId,
    NOME_CORSO: data.courseName,
    LOCATION: data.location,
    COURSE_START_DATE: data.parsedCalendar.startDate?.toLocaleDateString('it-IT') || '',
    COURSE_END_DATE: data.parsedCalendar.endDate?.toLocaleDateString('it-IT') || '',
    COURSE_DURATION: `${data.parsedCalendar.totalHours} ore`,
    OPERATOR: data.operation,
    TEACHER_NAME: data.mainTeacher,
    TOTAL_PAGES: totalPages.toString(),
    
    // Participants
    ...participantData,
    
    // Office days for dynamic pages
    officeDays
  };

  console.log('Generated template data:', templateData);
  return templateData;
};

export const generateWordDocument = async (data: CourseData, templateName: string = 'calendario'): Promise<void> => {
  try {
    console.log('Starting Word document generation with template:', templateName);
    
    // Load the template file
    const templatePath = `/templates/${templateName}.docx`;
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(`Template not found: ${templatePath}. Please upload the template to public/templates/`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    
    // Create docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Generate template data
    const templateData = generateWordTemplateData(data);
    
    // Handle dynamic pages for office days
    if (templateData.officeDays.length > 0) {
      console.log(`Generating ${templateData.officeDays.length} office days with ${templateData.officeDays.length * 2} additional pages`);
      
      // For each office day, we need to create the lesson day data
      const lessonDays = templateData.officeDays.map(day => ({
        LESSON_DAY: day.LESSON_DAY,
        LESSON_MONTH: day.LESSON_MONTH,
        LESSON_YEAR: day.LESSON_YEAR
      }));
      
      // Add the lesson days array to template data for looping
      (templateData as any).lessonDays = lessonDays;
    }
    
    // Set the template data
    doc.setData(templateData);
    
    try {
      // Render the document
      doc.render();
    } catch (error) {
      console.error('Error rendering document:', error);
      throw new Error('Errore nella generazione del documento. Verificare che il template contenga i placeholder corretti.');
    }
    
    // Generate the output
    const output = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    
    // Create download link
    const filename = `registro_SEZ${data.sectionId}_CORSO${data.projectId}_${templateName}_${new Date().toISOString().split('T')[0]}.docx`;
    const url = URL.createObjectURL(output);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('Word document generated successfully:', filename);
    
  } catch (error) {
    console.error('Error generating Word document:', error);
    if (error instanceof Error) {
      alert(`Errore durante la generazione del documento Word: ${error.message}`);
    } else {
      alert('Errore durante la generazione del documento Word. Verificare che il template sia stato caricato correttamente.');
    }
  }
};

export const listAvailableTemplates = async (): Promise<string[]> => {
  try {
    // This would need to be implemented based on your specific needs
    // For now, return a default list of expected templates
    const defaultTemplates = ['calendario', 'semplice', 'completo'];
    console.log('Available templates:', defaultTemplates);
    return defaultTemplates;
  } catch (error) {
    console.error('Error listing templates:', error);
    return ['calendario']; // fallback to default
  }
};
