
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { CourseData, Participant } from '@/types/course';

export interface ConvocationTemplateData {
  // Participant info
  NOME_BENEFICIARIO: string;
  COGNOME_BENEFICIARIO: string;
  CODICE_FISCALE_BENEFICIARIO: string;
  
  // Course info
  TITOLO_PERCORSO: string;
  MATERIA: string; // Added for the template
  ID_CORSO: string;
  ID_SEZIONE: string;
  DENOMINAZIONE_EROGATORE: string;
  ID_SOGGETTO_EROGATORE: string;
  SEDE_CORSO: string;
  DATA_INIZIO_CORSO: string; // Separate start date
  DATA_FINE_CORSO: string;   // Separate end date
  PERIODO_CORSO: string;     // Keep the range format too
  
  // Teacher and contact info
  NOME_DOCENTE: string;      // Full name, not split
  COGNOME_DOCENTE: string;   // Full surname, not split
  Teacher_EMAIL: string;     // Match your template placeholder
  EMAIL_CONTATTO: string;
  LUOGO: string;
  DATA_DOCUMENTO: string;
  NOME_ENTE: string;
  
  // Dynamic lessons table
  lessons: Array<{
    DATA: string;
    ORARIO_MATTINA: string;
    ORARIO_POMERIGGIO: string;
    ORE_TOTALI: string;
    DOCENTE: string;
  }>;
  
  TOTALE_ORE: string;
}

export const generateConvocationData = (data: CourseData, participant: Participant): ConvocationTemplateData => {
  console.log('Generating convocation data for participant:', participant);
  
  // Process lessons for the table
  const lessons = data.parsedCalendar.lessons.map(lesson => {
    const startHour = parseInt(lesson.startTime.split(':')[0]);
    const endHour = parseInt(lesson.endTime.split(':')[0]);
    
    // Determine morning/afternoon slots
    let mattina = '';
    let pomeriggio = '';
    
    if (startHour < 13) {
      mattina = `${lesson.startTime}-${endHour <= 13 ? lesson.endTime : '13:00'}`;
    }
    if (endHour > 14 || (endHour > 13 && startHour >= 13)) {
      const pomStart = startHour >= 14 ? lesson.startTime : '14:00';
      pomeriggio = `${pomStart}-${lesson.endTime}`;
    }
    
    return {
      DATA: lesson.date,
      ORARIO_MATTINA: mattina,
      ORARIO_POMERIGGIO: pomeriggio,
      ORE_TOTALI: lesson.hours.toString(),
      DOCENTE: data.mainTeacher
    };
  });

  // Parse teacher name - assuming format "Nome Cognome"
  const teacherParts = data.mainTeacher.split(' ');
  const teacherNome = teacherParts[0] || '';
  const teacherCognome = teacherParts.slice(1).join(' ') || '';

  const templateData: ConvocationTemplateData = {
    // Participant info
    NOME_BENEFICIARIO: participant.nome,
    COGNOME_BENEFICIARIO: participant.cognome,
    CODICE_FISCALE_BENEFICIARIO: participant.codiceFiscale,
    
    // Course info
    TITOLO_PERCORSO: data.courseName,
    MATERIA: data.courseName, // Same as course name
    ID_CORSO: data.projectId,
    ID_SEZIONE: data.sectionId,
    DENOMINAZIONE_EROGATORE: 'AK GROUP SRL',
    ID_SOGGETTO_EROGATORE: 'AK001',
    SEDE_CORSO: data.location,
    DATA_INIZIO_CORSO: data.parsedCalendar.startDate?.toLocaleDateString('it-IT') || '',
    DATA_FINE_CORSO: data.parsedCalendar.endDate?.toLocaleDateString('it-IT') || '',
    PERIODO_CORSO: `${data.parsedCalendar.startDate?.toLocaleDateString('it-IT')} - ${data.parsedCalendar.endDate?.toLocaleDateString('it-IT')}`,
    
    // Teacher and contact info
    NOME_DOCENTE: teacherNome,
    COGNOME_DOCENTE: teacherCognome,
    Teacher_EMAIL: data.teacherEmail || 'info@akgroup.it', // Match your template
    EMAIL_CONTATTO: data.teacherEmail || 'info@akgroup.it',
    LUOGO: 'Milano',
    DATA_DOCUMENTO: new Date().toLocaleDateString('it-IT'),
    NOME_ENTE: 'AK GROUP SRL',
    
    // Lessons table
    lessons,
    
    TOTALE_ORE: data.parsedCalendar.totalHours.toString()
  };

  console.log('Generated convocation template data:', templateData);
  return templateData;
};

export const generateConvocationDocument = async (data: CourseData, participant: Participant): Promise<void> => {
  try {
    console.log('Starting convocation document generation for:', participant.nome, participant.cognome);
    
    // Load the template file
    const templatePath = '/templates/CONVOCAZIONE.docx';
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(`Template non trovato: ${templatePath}. Caricare il template CONVOCAZIONE.docx in public/templates/`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    
    // Create docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Generate template data
    const templateData = generateConvocationData(data, participant);
    
    // Set the template data
    doc.setData(templateData);
    
    try {
      // Render the document
      doc.render();
    } catch (error) {
      console.error('Error rendering convocation document:', error);
      throw new Error('Errore nella generazione della convocazione. Verificare che il template contenga i placeholder corretti.');
    }
    
    // Generate the output
    const output = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    
    // Create download link
    const filename = `CONVOCAZIONE_${participant.cognome}_${participant.nome}_SEZ${data.sectionId}_${new Date().toISOString().split('T')[0]}.docx`;
    const url = URL.createObjectURL(output);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('Convocation document generated successfully:', filename);
    
  } catch (error) {
    console.error('Error generating convocation document:', error);
    if (error instanceof Error) {
      alert(`Errore durante la generazione della convocazione: ${error.message}`);
    } else {
      alert('Errore durante la generazione della convocazione. Verificare che il template sia stato caricato correttamente.');
    }
  }
};

export const generateAllConvocations = async (data: CourseData): Promise<void> => {
  try {
    console.log(`Generating convocations for ${data.participants.length} participants`);
    
    for (const participant of data.participants) {
      await generateConvocationDocument(data, participant);
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    alert(`Convocazioni generate con successo per ${data.participants.length} partecipanti`);
    
  } catch (error) {
    console.error('Error generating all convocations:', error);
    alert('Errore durante la generazione delle convocazioni multiple');
  }
};
