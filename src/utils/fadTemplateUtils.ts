
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { CourseData } from '@/types/course';

export interface FADTemplateData {
  // Fixed entity info
  DENOMINAZIONE_ENTE: string;
  SEDE_ACCREDITATA: string;
  PIATTAFORMA: string;
  
  // Course info
  TITOLO_CORSO: string;
  ID_CORSO: string;
  ID_SEZIONE: string;
  ORE_FAD: string;
  OFFERTA_FORMATIVA: string;
  
  // Teacher/Referent info
  REFERENTE: string;
  EMAIL_TELEFONO: string;
  
  // Zoom info
  LINK_ZOOM: string;
  ID_RIUNIONE: string;
  PASSCODE: string;
  
  // Dynamic online lessons table
  onlineLessons: Array<{
    MATERIA: string;
    DATA: string;
    ORARIO_INIZIO: string;
    ORARIO_FINE: string;
    ORE: string;
  }>;
  
  // Participants (up to 20)
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
}

export const generateFADTemplateData = (data: CourseData): FADTemplateData => {
  console.log('Generating FAD template data:', data);
  
  // Filter only online lessons for FAD
  const onlineLessons = data.parsedCalendar.lessons
    .filter(lesson => lesson.location === 'Online')
    .map(lesson => ({
      MATERIA: lesson.subject,
      DATA: lesson.date,
      ORARIO_INIZIO: lesson.startTime,
      ORARIO_FINE: lesson.endTime,
      ORE: lesson.hours.toString()
    }));

  // Prepare participant data (up to 20 slots)
  const participantData: { [key: string]: string } = {};
  data.participants.forEach((participant, index) => {
    if (index < 20) {
      const userKey = `USER_${index + 1}`;
      participantData[userKey] = `${participant.cognome} ${participant.nome}`;
    }
  });

  // Format teacher contact info
  const emailTelefono = `${data.teacherEmail || ''} ${data.teacherPhone || ''}`.trim();

  const templateData: FADTemplateData = {
    // Fixed entity info
    DENOMINAZIONE_ENTE: 'AK GROUP SRL',
    SEDE_ACCREDITATA: 'Viale Vittorio Veneto 20 Milano',
    PIATTAFORMA: 'Zoom',
    
    // Course info
    TITOLO_CORSO: data.courseName,
    ID_CORSO: data.projectId,
    ID_SEZIONE: data.sectionId,
    ORE_FAD: data.parsedCalendar.fadHours?.toString() || data.parsedCalendar.onlineHours.toString(),
    OFFERTA_FORMATIVA: '1020 – GOL Offerta per Formazione mirata all\'inserimento lavorativo',
    
    // Teacher/Referent info
    REFERENTE: data.mainTeacher,
    EMAIL_TELEFONO: emailTelefono,
    
    // Zoom info
    LINK_ZOOM: data.zoomLink || '',
    ID_RIUNIONE: data.zoomId || '',
    PASSCODE: data.zoomPasscode || '',
    
    // Online lessons
    onlineLessons,
    
    // Participants
    ...participantData
  };

  console.log('Generated FAD template data:', templateData);
  return templateData;
};

export const generateFADDocument = async (data: CourseData): Promise<void> => {
  try {
    console.log('Starting FAD document generation');
    
    // Validate online lessons exist
    const onlineLessons = data.parsedCalendar.lessons.filter(l => l.location === 'Online');
    if (onlineLessons.length === 0) {
      throw new Error('Nessuna lezione online trovata. Il Modulo A FAD richiede almeno una lezione online.');
    }

    // Validate Zoom data
    if (!data.zoomLink && !data.zoomId) {
      throw new Error('Dati Zoom mancanti. Inserire i dati Zoom per generare il Modulo A FAD.');
    }

    // Load the template file
    const templatePath = '/templates/MODULO_A_FAD.docx';
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(`Template non trovato: ${templatePath}. Caricare il template MODULO_A_FAD.docx in public/templates/`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    
    // Create docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Generate template data
    const templateData = generateFADTemplateData(data);
    
    // Set the template data
    doc.setData(templateData);
    
    try {
      // Render the document
      doc.render();
    } catch (error) {
      console.error('Error rendering FAD document:', error);
      throw new Error('Errore nella generazione del Modulo A FAD. Verificare che il template contenga i placeholder corretti.');
    }
    
    // Generate the output
    const output = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    
    // Create download link
    const filename = `MODULO_A_FAD_SEZ${data.sectionId}_CORSO${data.projectId}_${new Date().toISOString().split('T')[0]}.docx`;
    const url = URL.createObjectURL(output);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('FAD document generated successfully:', filename);
    
  } catch (error) {
    console.error('Error generating FAD document:', error);
    if (error instanceof Error) {
      alert(`Errore durante la generazione del Modulo A FAD: ${error.message}`);
    } else {
      alert('Errore durante la generazione del Modulo A FAD. Verificare che il template sia stato caricato correttamente.');
    }
  }
};
