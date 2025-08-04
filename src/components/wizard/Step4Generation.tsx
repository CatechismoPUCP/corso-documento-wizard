
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, RotateCcw, Download } from "lucide-react";
import { CourseData } from '@/types/course';
import * as XLSX from 'xlsx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

interface Step4GenerationProps {
  data: CourseData;
  onReset: () => void;
}

const Step4Generation = ({ data, onReset }: Step4GenerationProps) => {
  const generateDocument = async (templateName: string, outputName: string, templateData: any) => {
    try {
      console.log(`Generating ${outputName} with data:`, data);

      const response = await fetch(`/templates/${templateName}`);
      if (!response.ok) {
        throw new Error(`Template ${templateName} not found`);
      }
      const templateBlob = await response.arrayBuffer();

      const zip = new PizZip(templateBlob);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}',
        },
        parser: (tag) => {
          return {
            get: (scope) => {
              if (tag === '.') {
                return scope;
              }
              if (tag.startsWith('#') || tag.startsWith('/')) {
                const tagName = tag.substring(1);
                return scope[tagName];
              }
              return scope[tag];
            },
          };
        },
      });

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
      alert(`Errore durante la generazione del documento ${outputName}.`);
    }
  };

  const generateRegister = () => {
    console.log('🏫 Generating Registro with updated template data...');
    
    // Calculate total pages (estimate based on lessons and participants)
    const totalPages = Math.max(1, Math.ceil((data.parsedCalendar.lessons.length + data.participants.length) / 10));
    
    // Create participant placeholders (PARTECIPANTE_1 through PARTECIPANTE_13)
    const participantData: { [key: string]: string } = {};
    for (let i = 1; i <= 13; i++) {
      const participant = data.participants[i - 1];
      participantData[`PARTECIPANTE_${i}`] = participant 
        ? `${participant.cognome} ${participant.nome}` 
        : '';
    }
    
    const templateData = {
      ID_PROGETTO: data.projectId || '',
      ID_SEZIONE: data.sectionId || '',
      NOME_CORSO: data.courseName || '',
      SEDE_CORSO: data.location || '',
      DATA_INIZIO: data.parsedCalendar.lessons.length > 0 
        ? data.parsedCalendar.lessons[0].date 
        : '',
      DATA_FINE: data.parsedCalendar.lessons.length > 0 
        ? data.parsedCalendar.lessons[data.parsedCalendar.lessons.length - 1].date 
        : '',
      TOTALE_ORE: data.parsedCalendar.totalHours || 0,
      NOME_DOCENTE: data.mainTeacher || '',
      TOTALE_PAG: totalPages,
      ...participantData
    };
    
    console.log('📋 Template data for Registro:', templateData);
    generateDocument('Registro.docx', 'Registro', templateData);
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
      EMAIL_REFERENTE: '', // Missing data
      TELEFONO_REFERENTE: '', // Missing data
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
    generateDocument('modello A fad.docx', 'Modulo_FAD', templateData);
  };

  const generateMinutes = () => {
    const templateData = {
      OPERATORE: data.operation,
      ID_CORSO: data.projectId,
      ID_SEZIONE: data.sectionId,
      NOME_DOCENTE: data.mainTeacher,
      // Supervisore is static in template
      participants: data.participants.map(p => ({ NOME_COMPLETO: `${p.cognome} ${p.nome}` })),
      DATA_FINE: data.parsedCalendar.lessons[data.parsedCalendar.lessons.length - 1]?.date,
      SEDE_CORSO: data.location,
    };
    generateDocument('Verbale.docx', 'Verbale', templateData);
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
              <Button onClick={generateSampleData} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Scarica Dati JSON
              </Button>
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
