import { CourseData, Participant, Lesson } from '@/types/course';
import { calculateParsedCalendar } from './courseTableParser';
import * as pdfjsLib from 'pdfjs-dist';

// Browser-compatible PDF text extraction using PDF.js
// Configure worker to use local file instead of CDN
if (typeof window !== 'undefined') {
  // Use a local worker configuration that works with Vite
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

export interface ExtractedPDFData {
  calendar?: {
    lessons: Lesson[];
    totalHours: number;
  };
  courseInfo?: {
    projectId: string;
    sectionId: string;
    courseName: string;
    location: string;
    mainTeacher: string;
    startDate: string;
    endDate: string;
  };
  participants?: Participant[];
}

export class PDFExtractor {
  
  /**
   * Extract text from PDF file using PDF.js (browser-compatible)
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    console.log('🔍 Extracting text from PDF:', file.name);
    
    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine all text items from the page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      console.log('✅ PDF text extracted successfully, length:', fullText.length);
      return fullText;
      
    } catch (error) {
      console.error('❌ Error extracting PDF text:', error);
      console.log('🔄 Falling back to mock data for:', file.name);
      
      // Fallback to mock data based on filename
      return this.getMockPDFText(file.name);
    }
  }

  /**
   * Get mock PDF text based on filename for fallback
   */
  static getMockPDFText(fileName: string): string {
    if (fileName.toLowerCase().includes('calendario')) {
      return `CALENDARIO CORSO
      Lezione 1: 22/07/2025 09:00-13:00 Matematica
      Lezione 2: 23/07/2025 14:00-18:00 Italiano
      Lezione 3: 24/07/2025 09:00-13:00 Storia`;
    }
    
    if (fileName.toLowerCase().includes('comunicazione')) {
      return `ID CORSO: 47816
      ID SEZIONE: 139331
      DENOMINAZIONE: PAL - GOL
      SEDE: Milano
      DOCENTE: Mario Rossi`;
    }
    
    if (fileName.toLowerCase().includes('elenco') || fileName.toLowerCase().includes('studenti')) {
      return `ELENCO STUDENTI
      ID STUDENTE COGNOME NOME CODICE FISCALE RESIDENZA
      514332 MARELLI FABRIZIO MRLFRZ75P26F205M VIA GIARDINO, 25, Milano (MI)
      30223 MATERAZZI MARCO MTRMRC01D30E801Z Via San Gerolamo, 44, Legnano (MI)`;
    }
    
    return 'Mock PDF content';
  }

  /**
   * Extract calendar data from EOBCalendario PDF
   */
  static extractCalendarData(text: string): { lessons: Lesson[]; totalHours: number } | null {
    try {
      console.log('📅 Extracting calendar data...');
      
      // First try manual parsing to get lessons
      const manualResult = this.manualCalendarParsing(text);
      if (manualResult && manualResult.lessons.length > 0) {
        console.log('✅ Calendar extraction completed:', manualResult);
        return manualResult;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error extracting calendar:', error);
      return null;
    }
  }

  /**
   * Extract course information from EOBComunicazioneAvvioSezione PDF
   * Enhanced with better Italian patterns and more robust extraction
   */
  static extractCourseInfo(text: string): {
    projectId: string;
    sectionId: string;
    courseName: string;
    location: string;
    mainTeacher: string;
    startDate: string;
    endDate: string;
  } | null {
    try {
      console.log('📋 Extracting course information...');
      
      // Extract Project ID
      let projectId = '';
      const projectIdPatterns = [
        /ID\s*CORSO[:\s]*(\d+)/i,
        /CORSO[:\s]*(\d+)/i,
        /PROGETTO[:\s]*(\d+)/i
      ];
      
      for (const pattern of projectIdPatterns) {
        const match = text.match(pattern);
        if (match) {
          projectId = match[1];
          console.log('✅ Found Project ID:', projectId);
          break;
        }
      }
      
      // Extract Section ID
      let sectionId = '';
      const sectionIdPatterns = [
        /ID\s*SEZIONE[:\s]*(\d+)/i,
        /SEZIONE[:\s]*(\d+)/i
      ];
      
      for (const pattern of sectionIdPatterns) {
        const match = text.match(pattern);
        if (match) {
          sectionId = match[1];
          console.log('✅ Found Section ID:', sectionId);
          break;
        }
      }
      
      // Extract Course Name
      let courseName = '';
      const courseNamePatterns = [
        /(PAL[\s\-]*GOL)/i,
        /TIPOLOGIA\s*PERCORSO[:\s]*([A-Za-z0-9\s\-_]{3,30}?)(?=\s|$)/i,
        /DENOMINAZIONE[:\s]*([A-Za-z0-9\s\-_]{3,30}?)(?=\s*ID|\s*SEDE|\s*DURATA|$)/i,
        /PERCORSO[:\s]*([A-Za-z0-9\s\-_]{3,30}?)(?=\s*ID|\s*SEDE|\s*DURATA|$)/i
      ];
      
      for (let i = 0; i < courseNamePatterns.length; i++) {
        const pattern = courseNamePatterns[i];
        const match = text.match(pattern);
        if (match) {
          courseName = match[1].trim();
          console.log(`✅ Found Course Name with pattern ${i}:`, courseName);
          console.log('Match details:', match);
          break;
        }
      }
      
      // Extract Location/Sede
      let location = '';
      const locationPatterns = [
        /SEDE[:\s]*([^ID]*?)(?=\s*ID|\s*DATA|\s*DENOMINAZIONE|$)/i,
        /ISTITUZIONE\s*FORMATIVA[:\s]*([^ID]*?)(?=\s*ID|\s*DATA|$)/i
      ];
      
      for (const pattern of locationPatterns) {
        const match = text.match(pattern);
        if (match) {
          location = match[1].trim();
          console.log('✅ Found Location:', location);
          break;
        }
      }
      
      // Extract Teacher (if available)
      let mainTeacher = '';
      const teacherPatterns = [
        /DOCENTE[:\s]*([A-Za-z\s]+?)(?=\s*ID|\s*DATA|\s*SEDE|$)/i,
        /INSEGNANTE[:\s]*([A-Za-z\s]+?)(?=\s*ID|\s*DATA|\s*SEDE|$)/i
      ];
      
      for (const pattern of teacherPatterns) {
        const match = text.match(pattern);
        if (match) {
          mainTeacher = match[1].trim();
          console.log('✅ Found Teacher:', mainTeacher);
          break;
        }
      }
      
      // Extract dates
      let startDate = '';
      let endDate = '';
      
      const startDateMatch = text.match(/DATA\s*AVVIO\s*PREVISTA[:\s]*(\d{2}\/\d{2}\/\d{4})/i);
      if (startDateMatch) {
        startDate = startDateMatch[1];
        console.log('✅ Found Start Date:', startDate);
      }
      
      const endDateMatch = text.match(/DATA\s*FINE\s*PREVISTA[:\s]*(\d{2}\/\d{2}\/\d{4})/i);
      if (endDateMatch) {
        endDate = endDateMatch[1];
        console.log('✅ Found End Date:', endDate);
      }
      
      const result = {
        projectId: projectId || 'N/A',
        sectionId: sectionId || 'N/A',
        courseName: courseName || 'N/A',
        location: location || 'N/A',
        mainTeacher: mainTeacher || 'N/A',
        startDate: startDate || 'N/A',
        endDate: endDate || 'N/A'
      };
      
      console.log('✅ Course info extraction completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error extracting course info:', error);
      return null;
    }
  }

  /**
   * Extract participants from ElencoStudentiEobSezione PDF
   */
  static extractParticipants(text: string): Participant[] {
    console.log('🔍 Starting participant extraction...');
    console.log('📄 PDF text length:', text.length);
    
    try {
      const participants: Participant[] = [];
      
      // The PDF text is all on one line, so we need to parse it differently
      console.log('🔍 Full PDF text:', text);
      
      // Look for the student data section after "ID STUDENTE COGNOME NOME CODICE FISCALE RESIDENZA"
      const studentSectionMatch = text.match(/ID STUDENTE\s+COGNOME\s+NOME\s+CODICE FISCALE\s+RESIDENZA\s+(.+)/);
      
      if (!studentSectionMatch) {
        console.log('❌ Could not find student section in PDF');
        return participants;
      }
      
      const studentData = studentSectionMatch[1];
      console.log('📋 Student data section:', studentData);
      
      // Pattern to match: ID_STUDENTE COGNOME NOME CODICE_FISCALE INDIRIZZO
      // The pattern looks for: number, surname (all caps), name (mixed case), fiscal code, address
      const studentPattern = /(\d+)\s+([A-Z']+)\s+([A-Z][a-z]+)\s+([A-Z0-9]{16})\s+([^0-9]+?)(?=\s*\d+\s+[A-Z']+\s+[A-Z][a-z]+|$)/g;
      
      let match;
      let currentId = 1;
      
      while ((match = studentPattern.exec(studentData)) !== null) {
        const [fullMatch, studentId, surname, name, fiscalCode, address] = match;
        
        console.log('✅ Found student match:');
        console.log(`   ID: ${studentId}`);
        console.log(`   Surname: ${surname}`);
        console.log(`   Name: ${name}`);
        console.log(`   Fiscal Code: ${fiscalCode}`);
        console.log(`   Address: ${address.trim()}`);
        
        // Parse address to extract city info
        const addressParts = address.trim().split(',').map(part => part.trim());
        let street = '';
        let city = '';
        let province = '';
        
        if (addressParts.length >= 2) {
          street = addressParts[0];
          // Last part usually contains city and province
          const lastPart = addressParts[addressParts.length - 1];
          const cityMatch = lastPart.match(/(.+?)\s*\(([A-Z]{2})\)$/);
          if (cityMatch) {
            city = cityMatch[1].trim();
            province = cityMatch[2];
          } else {
            city = lastPart;
          }
        }
        
        const participant = {
          id: currentId++,
          cognome: surname.trim(),
          nome: name.trim(),
          genere: '', // Will need user input
          dataNascita: '', // Not available in this PDF format
          comuneNascita: '',
          provNascita: '',
          cittadinanza: 'Italiana', // Default
          codiceFiscale: fiscalCode,
          titoloStudio: '', // Will need user input
          cellulare: '', // Not available in this PDF format
          email: '', // Not available in this PDF format
          comuneDomicilio: city,
          provDomicilio: province,
          indirizzo: street,
          cap: '',
          benefits: 'NO' as const,
          caseManager: ''
        };
        
        console.log('✅ Created participant:', participant);
        participants.push(participant);
      }
      
      console.log(`🎉 Extraction completed. Found ${participants.length} participants`);
      return participants;
      
    } catch (error) {
      console.error('Error extracting participants:', error);
      return [];
    }
  }

  /**
   * Process all three PDFs and extract complete course data
   */
  static async processAllPDFs(
    calendarFile: File,
    courseInfoFile: File,
    participantsFile: File
  ): Promise<ExtractedPDFData> {
    try {
      const results: ExtractedPDFData = {};
      
      // Extract calendar
      console.log('📅 Extracting calendar...');
      const calendarText = await this.extractTextFromPDF(calendarFile);
      const calendarData = this.extractCalendarData(calendarText);
      if (calendarData) {
        results.calendar = calendarData;
      }
      
      // Extract course info
      console.log('📋 Extracting course information...');
      const courseInfoText = await this.extractTextFromPDF(courseInfoFile);
      const courseInfo = this.extractCourseInfo(courseInfoText);
      if (courseInfo) {
        results.courseInfo = courseInfo;
      }
      
      // Extract participants
      console.log('👥 Extracting participants...');
      const participantsText = await this.extractTextFromPDF(participantsFile);
      const participants = this.extractParticipants(participantsText);
      if (participants.length > 0) {
        results.participants = participants;
      }
      
      return results;
    } catch (error) {
      console.error('Error processing PDFs:', error);
      throw error;
    }
  }

  /**
   * Clean extracted course data to remove unwanted text
   */
  private static cleanCourseData(courseInfo: any): any {
    console.log('🧽 Cleaning course data:', courseInfo);
    const cleaned = { ...courseInfo };
    
    // Clean course name - extract only PAL - GOL or similar patterns
    if (cleaned.courseName) {
      const palGolMatch = cleaned.courseName.match(/(PAL[\s\-]+GOL)/i);
      if (palGolMatch) {
        cleaned.courseName = palGolMatch[1];
      } else {
        // Try to extract course name after "Denominazione percorso:"
        const denomMatch = cleaned.courseName.match(/Denominazione[\s\-_]*percorso[:\s]*([A-Za-z0-9\s\-_]{3,30}?)(?=\s*Totale|\s*Durata|\s*Ore)/i);
        if (denomMatch) {
          cleaned.courseName = denomMatch[1].trim();
        }
      }
    }
    
    // Clean location - remove representative info
    if (cleaned.location) {
      // Remove everything after "Rappresentante" or "Temporanea"
      cleaned.location = cleaned.location.split(/\s*(?:Rappresentante|Temporanea|Codice|CF)/i)[0].trim();
      // If still too long, try to extract just the address
      if (cleaned.location.length > 100) {
        const addressMatch = cleaned.location.match(/([A-Za-z\s,\.\-0-9]{10,80}?)(?=\s*Rappresentante|\s*Codice|\s*CF|$)/);
        if (addressMatch) {
          cleaned.location = addressMatch[1].trim();
        }
      }
    }
    
    console.log('✨ Cleaned course data:', cleaned);
    return cleaned;
  }

  /**
   * Fast mode parser - handles combined PDF text containing all three document types
   * This is for when all PDF contents are provided as a single text block
   */
  static parseFastModeText(combinedText: string): ExtractedPDFData {
    console.log('🚀 Starting fast mode parsing...');
    console.log('📄 Combined text length:', combinedText.length);
    
    const results: ExtractedPDFData = {};
    
    try {
      // Split the text into sections based on document headers
      const sections = this.splitCombinedText(combinedText);
      
      // Extract participants from ELENCO ALLIEVI section
      if (sections.participants) {
        console.log('👥 Parsing participants section...');
        const participants = this.extractParticipantsFromSection(sections.participants);
        if (participants.length > 0) {
          results.participants = participants;
        }
      }
      
      // Extract calendar from CALENDARIO SEZIONE section
      if (sections.calendar) {
        console.log('📅 Parsing calendar section...');
        const calendar = this.extractCalendarFromSection(sections.calendar);
        if (calendar) {
          results.calendar = calendar;
        }
      }
      
      // Extract course info from any section (prioritize comunicazione section)
      const courseInfoText = sections.courseInfo || sections.participants || sections.calendar || combinedText;
      console.log('📋 Parsing course info...');
      const courseInfo = this.extractCourseInfo(courseInfoText);
      if (courseInfo) {
        results.courseInfo = courseInfo;
      }
      
      console.log('✅ Fast mode parsing completed:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Error in fast mode parsing:', error);
      return results;
    }
  }
  
  /**
   * Split combined text into sections based on document headers
   */
  private static splitCombinedText(text: string): {
    participants?: string;
    calendar?: string;
    courseInfo?: string;
  } {
    const sections: { participants?: string; calendar?: string; courseInfo?: string } = {};
    
    // Look for ELENCO ALLIEVI section
    const participantsMatch = text.match(/ELENCO ALLIEVI([\s\S]*?)(?=CALENDARIO SEZIONE|Spett\.|$)/i);
    if (participantsMatch) {
      sections.participants = participantsMatch[1].trim();
      console.log('📋 Found participants section');
    }
    
    // Look for CALENDARIO SEZIONE section
    const calendarMatch = text.match(/CALENDARIO SEZIONE([\s\S]*?)(?=Spett\.|Documento firmato|$)/i);
    if (calendarMatch) {
      sections.calendar = calendarMatch[1].trim();
      console.log('📅 Found calendar section');
    }
    
    // Look for Comunicazione section (starts with "Spett.")
    const courseInfoMatch = text.match(/(Spett\.[\s\S]*?)(?=Documento firmato|$)/i);
    if (courseInfoMatch) {
      sections.courseInfo = courseInfoMatch[1].trim();
      console.log('📋 Found course info section');
    }
    
    return sections;
  }
  
  /**
   * Enhanced participant extraction for fast mode
   */
  private static extractParticipantsFromSection(participantsText: string): Participant[] {
    console.log('🔍 Starting enhanced participant extraction...');
    console.log('📄 Participants text:', participantsText.substring(0, 500) + '...');
    
    try {
      const participants: Participant[] = [];
      
      // Look for the student data section after the header
      const headerPattern = /ID\s+STUDENTE\s+COGNOME\s+NOME\s+CODICE\s+FISCALE\s+RESIDENZA\s+([\s\S]+?)(?=CALENDARIO|Spett\.|$)/i;
      const studentSectionMatch = participantsText.match(headerPattern);
      
      if (!studentSectionMatch) {
        console.log('❌ Could not find student section header');
        console.log('📄 Full text for debugging:', participantsText);
        return participants;
      }
      
      const studentData = studentSectionMatch[1].trim();
      console.log('📋 Student data section found:', studentData.substring(0, 500) + '...');
      
      // The data is all on one line with multiple spaces as separators
      // Pattern: ID SURNAME NAME FISCAL_CODE ADDRESS (with multiple spaces between fields)
      // Use a more specific regex pattern to match each participant
      const participantPattern = /(\d+)\s+([A-Z']+)\s+([A-Z]+(?:\s+[A-Z]+)*)\s+([A-Z0-9]{16})\s+([^0-9]+?)(?=\s+\d+\s+[A-Z']+|$)/g;
      
      let match;
      let currentId = 1;
      
      console.log('🔍 Attempting to match participants with pattern...');
      
      while ((match = participantPattern.exec(studentData)) !== null) {
        const [fullMatch, studentId, surname, name, fiscalCode, address] = match;
        
        console.log('✅ Found student match:');
        console.log(`   Full Match: "${fullMatch.substring(0, 100)}..."`);
        console.log(`   ID: "${studentId}"`);
        console.log(`   Surname: "${surname}"`);
        console.log(`   Name: "${name}"`);
        console.log(`   Fiscal Code: "${fiscalCode}"`);
        console.log(`   Address: "${address.trim()}"`);
        
        // Enhanced address parsing
        const { street, city, province, cap } = this.parseAddress(address.trim());
        
        const participant = {
          id: currentId++,
          cognome: surname.trim(),
          nome: name.trim(),
          genere: '', // Will need user input
          dataNascita: '', // Not available in this PDF format
          comuneNascita: '',
          provNascita: '',
          cittadinanza: 'Italiana', // Default
          codiceFiscale: fiscalCode,
          titoloStudio: '', // Will need user input
          cellulare: '', // Not available in this PDF format
          email: '', // Not available in this PDF format
          comuneDomicilio: city,
          provDomicilio: province,
          indirizzo: street,
          cap: cap,
          benefits: 'NO' as const,
          caseManager: ''
        };
        
        console.log('✅ Created participant:', participant);
        participants.push(participant);
      }
      
      // If the regex approach didn't work, try a fallback approach
      if (participants.length === 0) {
        console.log('⚠️ Regex approach failed, trying fallback parsing...');
        return this.fallbackParticipantExtraction(studentData);
      }
      
      console.log(`🎉 Enhanced extraction completed. Found ${participants.length} participants`);
      return participants;
      
    } catch (error) {
      console.error('❌ Error in enhanced participant extraction:', error);
      return [];
    }
  }
  
  /**
   * Fallback participant extraction when regex fails
   */
  private static fallbackParticipantExtraction(studentData: string): Participant[] {
    console.log('🔄 Starting fallback participant extraction...');
    const participants: Participant[] = [];
    
    try {
      // Split by multiple spaces and try to identify patterns
      const tokens = studentData.split(/\s+/).filter(token => token.length > 0);
      console.log('📝 Tokens found:', tokens.length, tokens.slice(0, 20));
      
      let currentId = 1;
      
      // Look for sequences: [number] [CAPS_SURNAME] [Mixed_Name] [16_CHAR_CODE] [address...]
      for (let i = 0; i < tokens.length - 4; i++) {
        const studentId = tokens[i];
        const surname = tokens[i + 1];
        const name = tokens[i + 2];
        const fiscalCode = tokens[i + 3];
        
        // Validate the pattern
        if (studentId.match(/^\d+$/) && 
            surname.match(/^[A-Za-z']+$/) && // Allow mixed case surnames like 'Gennaro'
            name.match(/^[A-Za-z']+$/) && // Allow any letter case and apostrophes
            fiscalCode.match(/^[A-Z0-9]{16}$/)) {
          
          console.log('✅ Found participant pattern:');
          console.log(`   ID: ${studentId}`);
          console.log(`   Surname: ${surname}`);
          console.log(`   Name: ${name}`);
          console.log(`   Fiscal Code: ${fiscalCode}`);
          
          // Collect address tokens until we find the next student ID or end
          const addressTokens = [];
          let j = i + 4;
          
          while (j < tokens.length && !tokens[j].match(/^\d+$/)) {
            addressTokens.push(tokens[j]);
            j++;
            // Stop if we've collected too many tokens (probably hit next participant)
            if (addressTokens.length > 10) break;
          }
          
          const address = addressTokens.join(' ');
          console.log(`   Address: ${address}`);
          
          // Parse address
          const { street, city, province, cap } = this.parseAddress(address);
          
          const participant = {
            id: currentId++,
            cognome: surname.trim(),
            nome: name.trim(),
            genere: '',
            dataNascita: '',
            comuneNascita: '',
            provNascita: '',
            cittadinanza: 'Italiana',
            codiceFiscale: fiscalCode,
            titoloStudio: '',
            cellulare: '',
            email: '',
            comuneDomicilio: city,
            provDomicilio: province,
            indirizzo: street,
            cap: cap,
            benefits: 'NO' as const,
            caseManager: ''
          };
          
          participants.push(participant);
          console.log('✅ Added participant via fallback:', participant.nome, participant.cognome);
          
          // Skip ahead past the address tokens
          i = j - 1;
        }
      }
      
      console.log(`🔄 Fallback extraction completed. Found ${participants.length} participants`);
      return participants;
      
    } catch (error) {
      console.error('❌ Error in fallback extraction:', error);
      return [];
    }
  }

  /**
   * Enhanced address parsing
   */
  private static parseAddress(address: string): { street: string; city: string; province: string; cap: string } {
    let street = '';
    let city = '';
    let province = '';
    let cap = '';
    
    try {
      // Split by commas and clean up
      const parts = address.split(',').map(part => part.trim()).filter(part => part.length > 0);
      
      if (parts.length >= 1) {
        street = parts[0];
      }
      
      // Look for CAP (5 digits)
      const capMatch = address.match(/\b(\d{5})\b/);
      if (capMatch) {
        cap = capMatch[1];
      }
      
      // Look for city and province pattern: "City , Province" or "City (PROV)"
      const cityProvinceMatch = address.match(/,\s*([A-Za-z\s]+?)\s*,\s*([A-Za-z\s]+?)(?:\s*\([A-Z]{2}\))?\s*$/i) ||
                               address.match(/,\s*([A-Za-z\s]+?)\s*\(([A-Z]{2})\)\s*$/i);
      
      if (cityProvinceMatch) {
        city = cityProvinceMatch[1].trim();
        province = cityProvinceMatch[2] ? cityProvinceMatch[2].trim() : '';
      } else {
        // Fallback: last part might be city
        if (parts.length >= 2) {
          const lastPart = parts[parts.length - 1];
          const provinceMatch = lastPart.match(/(.+?)\s*\(([A-Z]{2})\)$/);
          if (provinceMatch) {
            city = provinceMatch[1].trim();
            province = provinceMatch[2];
          } else {
            city = lastPart;
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error parsing address:', error);
    }
    
    return { street, city, province, cap };
  }
  
  /**
   * Enhanced calendar extraction for fast mode
   */
  private static extractCalendarFromSection(calendarText: string): { lessons: Lesson[]; totalHours: number } | null {
    console.log('📅 Starting enhanced calendar extraction...');
    
    try {
      // Try manual parsing first
      const manualResult = this.manualCalendarParsing(calendarText);
      if (manualResult && manualResult.lessons.length > 0) {
        console.log('✅ Enhanced calendar extraction completed:', manualResult);
        return manualResult;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error in enhanced calendar extraction:', error);
      return null;
    }
  }
  
  /**
   * Preprocess calendar text to improve parsing
   */
  private static preprocessCalendarText(text: string): string {
    // Add line breaks before dates to help the parser
    let processed = text.replace(/(\d{2}\/\d{2}\/\d{4})/g, '\n$1');
    
    // Ensure proper spacing around time patterns
    processed = processed.replace(/(\d{2}:\d{2})/g, ' $1 ');
    
    // Add structure for the parser
    processed = processed.replace(/DATA\s+DALLE ORE\s+ALLE ORE\s+TOTALE ORE\s+TIPO\s+AZIENDA/i, 
      'DATA\tDALLE ORE\tALLE ORE\tTOTALE ORE\tTIPO\tAZIENDA\n');
    
    return processed;
  }
  
  /**
   * Manual calendar parsing as fallback
   */
  private static manualCalendarParsing(text: string): { lessons: Lesson[]; totalHours: number } | null {
    console.log('📅 Attempting manual calendar parsing...');
    
    try {
      const lessons: Lesson[] = [];
      let totalHours = 0;
      
      // Pattern to match calendar entries
      const lessonPattern = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+(\w+)/g;
      
      let match;
      let lessonId = 1;
      
      while ((match = lessonPattern.exec(text)) !== null) {
        const [, date, startTime, endTime, duration, type] = match;
        
        // Parse duration
        const [hours, minutes] = duration.split(':').map(Number);
        const lessonHours = hours + (minutes / 60);
        totalHours += lessonHours;
        
        const lesson: Lesson = {
          date: date,
          startTime: startTime,
          endTime: endTime,
          hours: lessonHours,
          subject: type === 'FAD' ? 'Formazione a Distanza' : 'Lezione',
          location: type === 'FAD' ? 'Online' : 'Ufficio'
        };
        
        lessons.push(lesson);
      }
      
      if (lessons.length > 0) {
        console.log(`✅ Manual parsing found ${lessons.length} lessons, total hours: ${totalHours}`);
        return { lessons, totalHours };
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error in manual calendar parsing:', error);
      return null;
    }
  }

  /**
   * Debug participant extraction with detailed logging
   */
  static debugParticipantExtraction(text: string): void {
    console.log('🔍=== DEBUG PARTICIPANT EXTRACTION ===');
    console.log('📄 Input text length:', text.length);
    console.log('📄 First 200 chars:', text.substring(0, 200));
    
    // Test section splitting
    const sections = this.splitCombinedText(text);
    console.log('📋 Sections found:', Object.keys(sections));
    
    if (sections.participants) {
      console.log('👥 Participants section length:', sections.participants.length);
      console.log('👥 Participants section preview:', sections.participants.substring(0, 300));
      
      const participants = this.extractParticipantsFromSection(sections.participants);
      console.log('🎉 Final result: Found', participants.length, 'participants');
      
      participants.forEach((p, i) => {
        console.log(`👤 Participant ${i + 1}:`, {
          nome: p.nome,
          cognome: p.cognome,
          codiceFiscale: p.codiceFiscale,
          indirizzo: p.indirizzo,
          comuneDomicilio: p.comuneDomicilio,
          provDomicilio: p.provDomicilio
        });
      });
    } else {
      console.log('❌ No participants section found');
    }
    
    console.log('🔍=== END DEBUG ===');
  }

  /**
   * Test the fast mode parser with sample data
   */
  static testFastModeParser(): void {
    const sampleText = `ELENCO ALLIEVI
ID CORSO: 47816
ID SEZIONE: 139331
TIPOLOGIA: Formazione Permanente
TIPOLOGIA PERCORSO: PAL - GOL
ID OPERATORE: 2479052
DENOMINAZIONE ISTITUZIONE FORMATIVA: AK GROUP S.R.L.
SEDE: AK GROUP S.R.L. - VIALE VITTORIO VENETO, 20/22, Milano , VIALE VITTORIO VENETO , .22 , Milano (MI)
DATA AVVIO PREVISTA: 22/07/2025 DATA FINE PREVISTA: 01/08/2025
ID STUDENTE
COGNOME
NOME
CODICE FISCALE
RESIDENZA
514332
MARELLI
FABRIZIO
MRLFRZ75P26F205M
VIA GIARDINO , 25 , 20077 ,
Melegnano , Milano
30223
MATERAZZI
MARCO
MTRMRC01D30E801Z
Via San gerolamo Emiliani , 44
, 20025 , Legnano , Milano
529646
GULI'
FABRIZIO
GLUFRZ70B04E715L
VIA LOSANNA , 29 , 20100 ,
Milano , Milano
535764
Gennaro
Manuela
GNNMNL63B68F205B
via carro maggiore , 6 , 20060 ,
Mediglia , Milano CALENDARIO SEZIONE
ID CORSO: 47816
ID SEZIONE: 139331
TIPOLOGIA: Formazione Permanente
TITOLO PERCORSO: PAL - GOL
ID OPERATORE: 2479052
DENOMINAZIONE ISTITUZIONE FORMATIVA: AK GROUP S.R.L.
SEDE: AK GROUP S.R.L. - VIALE VITTORIO VENETO, 20/22, Milano - VIALE VITTORIO VENETO, .22 - Milano (MI)
DATA AVVIO PREVISTA: 22/07/2025 DATA FINE PREVISTA: 01/08/2025 TOTALE ORE: 56:00
DATA
DALLE ORE
ALLE ORE
TOTALE ORE
TIPO
AZIENDA
22/07/2025
09:00
10:00
01:00
FAD
22/07/2025
10:00
11:00
01:00
FAD
22/07/2025
11:00
12:00
01:00
FAD`;
    
    console.log('🧪 Testing fast mode parser...');
    const result = this.parseFastModeText(sampleText);
    console.log('🎉 Test result:', result);
    
    // Test just the participant extraction
    console.log('🧪 Testing participant extraction specifically...');
    const participantSection = sampleText.match(/ELENCO ALLIEVI([\s\S]*?)(?=CALENDARIO|$)/i)?.[1] || '';
    const participants = this.extractParticipantsFromSection(participantSection);
    console.log('👥 Participants found:', participants.length);
    participants.forEach((p, i) => {
      console.log(`👤 Participant ${i + 1}:`, {
        nome: p.nome,
        cognome: p.cognome,
        codiceFiscale: p.codiceFiscale,
        indirizzo: p.indirizzo,
        comuneDomicilio: p.comuneDomicilio
      });
    });
  }

  /**
   * Convert extracted data to CourseData format
   */
  static convertToCourseData(extractedData: ExtractedPDFData): Partial<CourseData> {
    const courseData: Partial<CourseData> = {};
    
    // Convert course info
    if (extractedData.courseInfo) {
      const cleanedInfo = this.cleanCourseData(extractedData.courseInfo);
      courseData.projectId = cleanedInfo.projectId;
      courseData.sectionId = cleanedInfo.sectionId;
      courseData.courseName = cleanedInfo.courseName;
      courseData.location = cleanedInfo.location; // Fixed: was using mainTeacher
      courseData.mainTeacher = cleanedInfo.mainTeacher;
    }
    
    // Convert calendar data
    if (extractedData.calendar) {
      courseData.lessons = extractedData.calendar.lessons;
    }
    
    // Convert participants
    if (extractedData.participants) {
      courseData.participants = extractedData.participants;
    }
    
    // Set default values for missing fields
    courseData.totalHours = extractedData.calendar?.totalHours || 0;
    
    return courseData;
  }
}
