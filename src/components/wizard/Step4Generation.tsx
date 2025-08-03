
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, RotateCcw, Download } from "lucide-react";
import { CourseData } from '@/types/course';
import * as XLSX from 'xlsx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { TemplateFixer } from '@/utils/templateFixer';
import { AdvancedTemplateFixer } from '@/utils/advancedTemplateFixer';
import { TemplateValidator } from '@/utils/templateValidator';
import { ExtremeTemplateFixer } from '@/utils/extremeTemplateFixer';

interface Step4GenerationProps {
  data: CourseData;
  onReset: () => void;
}

const Step4Generation = ({ data, onReset }: Step4GenerationProps) => {
  const generateDocument = async (templateName: string, outputName: string, templateData: any) => {
    try {
      console.log(`Generating ${outputName} with data:`, templateData);

      const response = await fetch(`/templates/${templateName}`);
      if (!response.ok) {
        throw new Error(`Template ${templateName} not found`);
      }
      const templateBlob = await response.arrayBuffer();

      // Fix template tags that may be corrupted by Word
      console.log(`🔧 Fixing template: ${templateName}`);
      let fixedTemplateBlob;
      
      try {
        // For severely corrupted templates, use ExtremeTemplateFixer first
        if (templateName.includes('HEAD') || templateName.includes('CONVOCAZIONE') || templateName.includes('Registro ID_')) {
          console.log('🚨 Using ExtremeTemplateFixer for severely corrupted template...');
          
          // Special handling for completely corrupted files
          if (templateName.includes('CONVOCAZIONE')) {
            console.log('⚠️ CONVOCAZIONE.docx is completely corrupted - skipping generation');
            alert('CONVOCAZIONE.docx è completamente corrotto e non può essere generato. Sostituire il file template.');
            return;
          }
          
          if (templateName.includes('Registro ID_') && !templateName.includes('HEAD')) {
            console.log('⚠️ Registro ID_{ID_CORSO}.docx has recursion issues - trying alternative approach');
            // Try multiple fixing approaches for this problematic template
            try {
              fixedTemplateBlob = await ExtremeTemplateFixer.fixTemplate(templateBlob);
            } catch (recursionError) {
              console.log('⚠️ ExtremeTemplateFixer failed, trying AdvancedTemplateFixer...');
              fixedTemplateBlob = await AdvancedTemplateFixer.fixTemplate(templateBlob);
            }
          } else {
            fixedTemplateBlob = await ExtremeTemplateFixer.fixTemplate(templateBlob);
          }
        } else {
          console.log('🔧 Trying AdvancedTemplateFixer first...');
          fixedTemplateBlob = await AdvancedTemplateFixer.fixTemplate(templateBlob);
          
          // Validate the advanced fix
          const advancedZip = new PizZip(fixedTemplateBlob);
          const advancedXml = advancedZip.file('word/document.xml')?.asText() || '';
          const advancedValidation = AdvancedTemplateFixer.validateTemplate(advancedXml);
          
          console.log('Advanced template validation:', advancedValidation);
          
          if (!advancedValidation.isValid || advancedValidation.foundVariables.length < 3) {
            console.log('🔄 Advanced fixing insufficient, trying ExtremeTemplateFixer...');
            fixedTemplateBlob = await ExtremeTemplateFixer.fixTemplate(templateBlob);
          }
        }
      } catch (fixError) {
        console.error('❌ Error during template fixing, trying fallback:', fixError);
        try {
          fixedTemplateBlob = await TemplateFixer.fixTemplate(templateBlob);
        } catch (fallbackError) {
          console.error('❌ All template fixers failed, using original:', fallbackError);
          fixedTemplateBlob = templateBlob;
        }
      }

      const zip = new PizZip(fixedTemplateBlob);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        errorLogging: false, // Disable error logging to avoid console spam
      });

      // Validate template data before rendering
      console.log('📊 Template data being sent to docxtemplater:', Object.keys(templateData));
      console.log('📊 Template data values:', templateData);
      
      doc.setData(templateData);
      doc.render();

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      saveAs(out, `${outputName}_${data.sectionId}.docx`);
      console.log(`${outputName} generated successfully`);

    } catch (error) {
      console.error(`Error generating ${outputName}:`, error);
      
      // Log detailed error information if it's a template error
      if (error.name === 'TemplateError' && error.properties) {
        console.error('Template error details:', error.properties);
        if (error.properties.errors) {
          console.error('Individual errors:', error.properties.errors);
          // Log first few errors in detail
          error.properties.errors.slice(0, 5).forEach((err: any, index: number) => {
            console.error(`Error ${index + 1}:`, {
              message: err.message,
              name: err.name,
              properties: err.properties,
              stack: err.stack?.split('\n')[0]
            });
          });
        }
      }
      
      alert(`Errore durante la generazione del documento ${outputName}: ${error.message}`);
    }
  };

  const generateRegister = () => {
    const templateData = {
      ID_PROGETTO: data.projectId,
      ID_CORSO: data.projectId, // Also provide ID_CORSO for compatibility
      ID_SEZIONE: data.sectionId,
      NOME_CORSO: data.courseName,
      SEDE_CORSO: data.location || 'Sede non specificata',
      DATA_INIZIO: data.parsedCalendar.lessons[0]?.date,
      DATA_FINE: data.parsedCalendar.lessons[data.parsedCalendar.lessons.length - 1]?.date,
      TOTALE_ORE: data.parsedCalendar.totalHours,
      TOTALE_PAG: Math.ceil(data.participants.length / 13), // Assuming 13 participants per page
      OPERATORE: data.operation,
      NOME_DOCENTE: data.mainTeacher,
      DATA_VIDIMAZIONE: data.parsedCalendar.lessons[data.parsedCalendar.lessons.length - 1]?.date,
      participants: data.participants.map(p => ({ NOME_COMPLETO: `${p.cognome} ${p.nome}` })),
      // Add individual participant placeholders (up to 13 as seen in template)
      ...Object.fromEntries(
        Array.from({ length: 13 }, (_, i) => {
          const participant = data.participants[i];
          return [`PARTECIPANTE_${i + 1}`, participant ? `${participant.cognome} ${participant.nome}` : ''];
        })
      ),
    };
    console.log('Register template data:', templateData);
    generateDocument(`Registro ID_{ID_CORSO}.docx`, 'Registro', templateData);
  };

  const generateFadModule = () => {
    const templateData = {
      DENOMINAZIONE_ENTE: data.operation,
      SEDE_ACCREDITATA: data.location,
      PIATTAFORMA: 'Zoom',
      TITOLO_CORSO: data.courseName,
      ID_CORSO: data.projectId,
      ID_SEZIONE: data.sectionId,
      ORE_FAD: data.parsedCalendar.onlineHours,
      REFERENTE: data.mainTeacher,
      DOCENTE: data.mainTeacher, // Add DOCENTE field that template expects
      EMAIL_REFERENTE: data.mainTeacher || '', // Use main teacher as referente email placeholder
      TELEFONO_REFERENTE: '', // Missing data - could be added to form later
      LINK_ZOOM: data.linkZoom,
      ID_RIUNIONE: data.idRiunione,
      PASSCODE: data.passcode,
      LEZIONI_FAD: data.parsedCalendar.lessons.filter(l => l.location === 'Online').map(l => ({
        DATA_LEZIONE: l.date,
        ORARIO_INIZIO: l.startTime,
        ORARIO_FINE: l.endTime,
        MATERIA: l.subject,
        DOCENTE: data.mainTeacher,
      })),
      participants: data.participants.map(p => ({ NOME_COMPLETO: `${p.cognome} ${p.nome}`, EMAIL: p.email })),
    };
    generateDocument(`modello A fad_{ID_CORSO}.docx`, 'Modulo_FAD', templateData);
  };

  const generateMinutes = () => {
    // Create minimal, clean data for Verbale template
    const templateData = {
      ID_CORSO: String(data.projectId || '48540'),
      ID_SEZIONE: String(data.sectionId || '140356'),
      NOME_DOCENTE: String(data.mainTeacher || 'Docente non specificato'),
      SEDE_CORSO: String(data.location || 'Sede non specificata'),
      DATA_FINE: String(data.parsedCalendar.lessons[data.parsedCalendar.lessons.length - 1]?.date || '31/12/2024'),
      // Remove complex objects that might cause issues
    };
    
    console.log('🎯 Verbale template data (clean):', templateData);
    console.log('🎯 All values are strings:', Object.values(templateData).every(v => typeof v === 'string'));
    console.log('🎯 No undefined values:', Object.values(templateData).every(v => v !== undefined && v !== null));
    
    generateDocument(`Verbale -{ID_CORSO} - Corso di formazione {ID-SEZIONE}.docx`, 'Verbale', templateData);
  };

  const generateExcelCalendar = () => {
    console.log('Generating Excel calendar with data:', data);
    
    try {
      // Create Excel data based on Python script logic
      const excelData = generateScheduleExcelData();
      
      if (excelData.length === 0) {
        alert('Nessuna lezione trovata per generare il calendario Excel.');
        return;
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set all columns to text format
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell_address = XLSX.utils.encode_cell({ c: C, r: R });
          if (!ws[cell_address]) continue;
          ws[cell_address].t = 's'; // Set type to string (text)
        }
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Calendario Lezioni');

      // Generate filename
      const filename = `calendario_lezioni_${data.sectionId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, filename);
      
      console.log('Excel calendar generated successfully');
    } catch (error) {
      console.error('Error generating Excel calendar:', error);
      alert('Errore durante la generazione del calendario Excel.');
    }
  };

  const generateScheduleExcelData = () => {
    const excelData: any[] = [];

    data.parsedCalendar.lessons.forEach(lesson => {
      // Parse lesson date and times
      const [day, month, year] = lesson.date.split('/');
      const lessonDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const startTime = lesson.startTime;
      const endTime = lesson.endTime;
      
      // Convert times to hours for calculation
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      // Generate hourly blocks (like the Python script)
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        // Skip lunch break hour (13:00-14:00)
        if (currentHour === 13) {
          currentHour = 14;
          currentMin = 0;
          continue;
        }
        
        const nextHour = currentHour + 1;
        const blockEndHour = Math.min(nextHour, endHour);
        const blockEndMin = blockEndHour === endHour ? endMin : 0;
        
        // Format times
        const blockStart = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        const blockEnd = `${blockEndHour.toString().padStart(2, '0')}:${blockEndMin.toString().padStart(2, '0')}`;
        
        // Determine tipologia and svolgimento based on location
        const isOffice = lesson.location === 'Ufficio';
        const tipologia = isOffice ? '1' : '4';
        const svolgimentoSedeLezione = isOffice ? '1' : '';
        
        excelData.push({
          'ID_SEZIONE': data.sectionId,
          'DATA LEZIONE': lesson.date,
          'TOTALE_ORE': '1',
          'ORA_INIZIO': blockStart,
          'ORA_FINE': blockEnd,
          'TIPOLOGIA': tipologia,
          'CODICE FISCALE DOCENTE': data.teacherCF || '',
          'MATERIA': lesson.subject,
          'CONTENUTI MATERIA': lesson.subject,
          'SVOLGIMENTO SEDE LEZIONE': svolgimentoSedeLezione
        });
        
        currentHour = nextHour;
        currentMin = 0;
        
        // Break if we've reached the end time
        if (currentHour >= endHour && currentMin >= endMin) {
          break;
        }
      }
    });

    return excelData;
  };

  const generateSampleData = () => {
    const sampleData = {
      courseInfo: {
        projectId: data.projectId,
        sectionId: data.sectionId,
        courseName: data.courseName,
        location: data.location, // Now properly included
        mainTeacher: data.mainTeacher,
        teacherCF: data.teacherCF, // Now properly included
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
    a.download = `corso_${data.sectionId}_dati.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const testTemplateFix = async () => {
    try {
      console.log('Testing template fixing on all templates...');
      
      const templates = [
        'Registro ID_{ID_CORSO}.docx',
        'modello A fad_{ID_CORSO}.docx',
        'Verbale -{ID_CORSO} - Corso di formazione {ID-SEZIONE}.docx'
      ];
      
      for (const templateName of templates) {
        console.log(`\n=== Testing template: ${templateName} ===`);
        
        try {
          const response = await fetch(`/templates/${templateName}`);
          if (!response.ok) {
            console.error(`Template ${templateName} not found`);
            continue;
          }
          
          const templateBlob = await response.arrayBuffer();
          
          // Test advanced fixer
          console.log('Testing AdvancedTemplateFixer...');
          const advancedFixed = await AdvancedTemplateFixer.fixTemplate(templateBlob);
          const advancedZip = new PizZip(advancedFixed);
          const advancedXml = advancedZip.file('word/document.xml')?.asText() || '';
          const advancedValidation = AdvancedTemplateFixer.validateTemplate(advancedXml);
          console.log('Advanced validation result:', advancedValidation);
          
          // Test regular fixer
          console.log('Testing TemplateFixer...');
          const regularFixed = await TemplateFixer.fixTemplate(templateBlob);
          const regularZip = new PizZip(regularFixed);
          const regularXml = regularZip.file('word/document.xml')?.asText() || '';
          const regularValidation = TemplateFixer.validateTemplateTags(regularXml);
          console.log('Regular validation result:', regularValidation);
          
        } catch (error) {
          console.error(`Error testing template ${templateName}:`, error);
        }
      }
      
      alert('Template testing completed. Check console for detailed results.');
      
    } catch (error) {
      console.error('Error during template testing:', error);
      alert('Error during template testing. Check console for details.');
    }
  };

  const validateTemplates = async () => {
    try {
      console.log('Starting comprehensive template validation...');
      
      const validation = await TemplateValidator.validateAllTemplates();
      
      // Also show what data we would send to each template
      console.log('\n=== DATA COMPARISON ===');
      
      const registerData = {
        ID_PROGETTO: data.projectId,
        ID_SEZIONE: data.sectionId,
        NOME_CORSO: data.courseName,
        SEDE_CORSO: data.location,
        DATA_INIZIO: data.parsedCalendar.lessons[0]?.date,
        DATA_FINE: data.parsedCalendar.lessons[data.parsedCalendar.lessons.length - 1]?.date,
        TOTALE_ORE: data.parsedCalendar.totalHours,
        OPERATORE: data.operation,
        NOME_DOCENTE: data.mainTeacher,
        DATA_VIDIMAZIONE: data.parsedCalendar.lessons[data.parsedCalendar.lessons.length - 1]?.date,
      };
      
      const fadData = {
        DENOMINAZIONE_ENTE: data.operation,
        SEDE_ACCREDITATA: data.location,
        PIATTAFORMA: 'Zoom',
        TITOLO_CORSO: data.courseName,
        ID_CORSO: data.projectId,
        ID_SEZIONE: data.sectionId,
        ORE_FAD: data.parsedCalendar.onlineHours,
        REFERENTE: data.mainTeacher,
        EMAIL_REFERENTE: '',
        TELEFONO_REFERENTE: '',
        LINK_ZOOM: data.linkZoom,
        ID_RIUNIONE: data.idRiunione,
        PASSCODE: data.passcode,
      };
      
      const verbaleData = {
        OPERATORE: data.operation,
        ID_CORSO: data.projectId,
        ID_SEZIONE: data.sectionId,
        NOME_DOCENTE: data.mainTeacher,
        DATA_FINE: data.parsedCalendar.lessons[data.parsedCalendar.lessons.length - 1]?.date,
        SEDE_CORSO: data.location,
      };
      
      // Compare each template with its data
      validation.templates.forEach((template: any) => {
        let templateData = {};
        if (template.templateName.includes('Registro ID_')) {
          templateData = registerData;
        } else if (template.templateName.includes('modello A fad')) {
          templateData = fadData;
        } else if (template.templateName.includes('Verbale')) {
          templateData = verbaleData;
        }
        
        if (Object.keys(templateData).length > 0) {
          const comparison = TemplateValidator.compareWithData(template, templateData);
          console.log(`\n--- ${template.templateName} ---`);
          console.log('Template expects:', template.placeholders);
          console.log('We provide:', Object.keys(templateData));
          console.log('Missing from data:', comparison.missing);
          console.log('Unused in template:', comparison.unused);
          console.log('Matches:', comparison.matches);
        }
      });
      
      // Generate and download report
      const report = await TemplateValidator.generateValidationReport();
      const blob = new Blob([report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-validation-report-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Show summary in alert
      const summary = validation.summary;
      const allPlaceholders = new Set();
      validation.templates.forEach((template: any) => {
        template.placeholders?.forEach((p: string) => allPlaceholders.add(p));
      });
      
      alert(`Template Validation Complete!\n\n` +
        `📊 Summary:\n` +
        `- Templates analyzed: ${summary.totalTemplates}\n` +
        `- Templates with issues: ${summary.templatesWithIssues}\n` +
        `- Total placeholders found: ${summary.totalPlaceholders}\n` +
        `- Broken placeholders: ${summary.totalBrokenPlaceholders}\n` +
        `- Unique placeholders: ${allPlaceholders.size}\n\n` +
        `📄 Detailed report downloaded as markdown file.\n` +
        `📋 Check console for detailed analysis and data comparison.`);
      
    } catch (error) {
      console.error('Error during template validation:', error);
      alert('Error during template validation. Check console for details.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generazione Documenti</CardTitle>
        <p className="text-gray-600">Seleziona il tipo di documento da generare</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">{data.parsedCalendar.totalHours}h</div>
              <div className="text-sm text-blue-600">Ore Totali</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">{data.participants.length}</div>
              <div className="text-sm text-green-600">Partecipanti</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-700">{data.parsedCalendar.lessons.length}</div>
              <div className="text-sm text-purple-600">Lezioni</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-700">{data.parsedCalendar.presenceHours}h</div>
              <div className="text-sm text-orange-600">In Presenza</div>
            </div>
          </div>

          {/* Generation Buttons */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-700">
                  <FileText className="w-6 h-6 mr-2" />
                  Genera Registro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Genera il registro didattico e di presenza del corso.
                </p>
                <Button onClick={generateRegister} className="w-full bg-blue-600 hover:bg-blue-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Genera Registro
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-yellow-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-700">
                  <FileText className="w-6 h-6 mr-2" />
                  Genera Modulo FAD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Genera il modulo per le attività di Formazione a Distanza.
                </p>
                <Button onClick={generateFadModule} className="w-full bg-yellow-600 hover:bg-yellow-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Genera Modulo FAD
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-700">
                  <FileText className="w-6 h-6 mr-2" />
                  Genera Verbale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Genera il verbale per il rilascio dell'attestato.
                </p>
                <Button onClick={generateMinutes} className="w-full bg-purple-600 hover:bg-purple-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Genera Verbale
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <Calendar className="w-6 h-6 mr-2" />
                  Calendario Excel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Esporta il calendario dettagliato in formato Excel con suddivisione 
                  oraria, tipologie lezione e informazioni docente (formato compatibile sistema).
                </p>
                <Button onClick={generateExcelCalendar} className="w-full bg-green-600 hover:bg-green-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Genera Calendario Excel
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sample Data Export */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-gray-700">Esportazione Dati (Sviluppo)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Per ora puoi esportare i dati elaborati in formato JSON per testing e sviluppo.
              </p>
              <div className="space-y-2">
                <Button onClick={generateSampleData} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Scarica Dati JSON
                </Button>
                <Button onClick={testTemplateFix} variant="outline" className="w-full bg-blue-50 hover:bg-blue-100">
                  <FileText className="w-4 h-4 mr-2" />
                  Test Template Fix (Debug)
                </Button>
                <Button onClick={validateTemplates} variant="outline" className="w-full bg-red-50 hover:bg-red-100">
                  <FileText className="w-4 h-4 mr-2" />
                  Validate Templates & Download Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reset Button */}
          <div className="pt-6 border-t">
            <Button 
              onClick={onReset} 
              variant="outline" 
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Inizia Nuovo Inserimento
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Step4Generation;
