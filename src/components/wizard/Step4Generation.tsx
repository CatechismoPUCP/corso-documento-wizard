import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, RotateCcw, Download, Share2, Users, ExternalLink } from "lucide-react";
import { CourseData } from '@/types/course';
import * as XLSX from 'xlsx';

interface Step4GenerationProps {
  data: CourseData;
  onReset: () => void;
}

const Step4Generation = ({ data, onReset }: Step4GenerationProps) => {
  const generateWordReport = () => {
    console.log('Generating Word report with data:', data);
    // TODO: Implement Word generation logic
    alert('Funzione Word Report in sviluppo');
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

  const generateGoogleCalendarUrl = () => {
    const lessons = data.parsedCalendar.lessons;
    if (lessons.length === 0) {
      alert('Nessuna lezione trovata per generare il link Google Calendar.');
      return;
    }

    // Create Google Calendar URL for the first lesson as example
    const firstLesson = lessons[0];
    const [day, month, year] = firstLesson.date.split('/');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Format dates for Google Calendar
    const formatDateForGoogle = (date: Date, time: string) => {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      return newDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDateTime = formatDateForGoogle(startDate, firstLesson.startTime);
    const endDateTime = formatDateForGoogle(startDate, firstLesson.endTime);
    
    const title = encodeURIComponent(`${data.courseName} - ${firstLesson.subject}`);
    const details = encodeURIComponent(`Corso: ${data.courseName}\nDocente: ${data.mainTeacher}\nModalità: ${firstLesson.location}`);
    const location = encodeURIComponent(firstLesson.location === 'Ufficio' ? data.location || 'In presenza' : 'Online');

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
    
    window.open(googleUrl, '_blank');
  };

  const generateTeamsUrl = () => {
    const lessons = data.parsedCalendar.lessons;
    if (lessons.length === 0) {
      alert('Nessuna lezione trovata per generare il link Teams.');
      return;
    }

    const firstLesson = lessons[0];
    const [day, month, year] = firstLesson.date.split('/');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const title = encodeURIComponent(`${data.courseName} - ${firstLesson.subject}`);
    const startTime = encodeURIComponent(`${firstLesson.date} ${firstLesson.startTime}`);
    const endTime = encodeURIComponent(`${firstLesson.date} ${firstLesson.endTime}`);
    
    // Microsoft Teams meeting URL format
    const teamsUrl = `https://teams.microsoft.com/l/meeting/new?subject=${title}&startTime=${startTime}&endTime=${endTime}`;
    
    window.open(teamsUrl, '_blank');
  };

  const downloadICalendar = () => {
    const lessons = data.parsedCalendar.lessons;
    if (lessons.length === 0) {
      alert('Nessuna lezione trovata per generare il file calendario.');
      return;
    }

    // Generate iCal format
    let icalContent = 'BEGIN:VCALENDAR\n';
    icalContent += 'VERSION:2.0\n';
    icalContent += 'PRODID:-//Lovable//Course Calendar//EN\n';
    icalContent += 'CALSCALE:GREGORIAN\n';

    lessons.forEach((lesson, index) => {
      const [day, month, year] = lesson.date.split('/');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const formatDateForICal = (date: Date, time: string) => {
        const [hours, minutes] = time.split(':');
        const newDate = new Date(date);
        newDate.setHours(parseInt(hours), parseInt(minutes));
        return newDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const startDateTime = formatDateForICal(startDate, lesson.startTime);
      const endDateTime = formatDateForICal(startDate, lesson.endTime);
      const uid = `lesson-${data.sectionId}-${index}@course-calendar.com`;
      
      icalContent += 'BEGIN:VEVENT\n';
      icalContent += `UID:${uid}\n`;
      icalContent += `DTSTART:${startDateTime}\n`;
      icalContent += `DTEND:${endDateTime}\n`;
      icalContent += `SUMMARY:${data.courseName} - ${lesson.subject}\n`;
      icalContent += `DESCRIPTION:Corso: ${data.courseName}\\nDocente: ${data.mainTeacher}\\nModalità: ${lesson.location}\n`;
      icalContent += `LOCATION:${lesson.location === 'Ufficio' ? (data.location || 'In presenza') : 'Online'}\n`;
      icalContent += 'END:VEVENT\n';
    });

    icalContent += 'END:VCALENDAR';

    // Download the file
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario_${data.sectionId}.ics`;
    a.click();
    URL.revokeObjectURL(url);
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
    a.download = `corso_${data.sectionId}_dati.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generazione Documenti</CardTitle>
        <p className="text-gray-600">Seleziona il tipo di documento da generare o sincronizza con i tuoi servizi preferiti</p>
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
                  Report Corso Word
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Genera un documento Word completo con tutti i dettagli del corso, 
                  lista partecipanti, registri presenza e riepiloghi orari.
                </p>
                <Button onClick={generateWordReport} className="w-full bg-blue-600 hover:bg-blue-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Genera Report Word
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

          {/* Calendar Integration Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Share2 className="w-5 h-5 mr-2" />
              Sincronizzazione Calendario
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Sincronizza facilmente il calendario del corso con i tuoi servizi preferiti o condividilo con gli studenti.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-2 hover:border-red-300 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-red-600 text-base">
                    <Calendar className="w-5 h-5 mr-2" />
                    Google Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600 mb-3">
                    Aggiungi direttamente al tuo Google Calendar e condividi con gli studenti.
                  </p>
                  <Button onClick={generateGoogleCalendarUrl} className="w-full bg-red-600 hover:bg-red-700 text-sm">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Apri in Google Calendar
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-300 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-purple-600 text-base">
                    <Users className="w-5 h-5 mr-2" />
                    Microsoft Teams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600 mb-3">
                    Crea meeting Teams per le lezioni online e organizza la classe.
                  </p>
                  <Button onClick={generateTeamsUrl} className="w-full bg-purple-600 hover:bg-purple-700 text-sm">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Crea Meeting Teams
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-indigo-300 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-indigo-600 text-base">
                    <Download className="w-5 h-5 mr-2" />
                    File Calendario (.ics)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600 mb-3">
                    Scarica file calendario universale compatibile con tutti i client.
                  </p>
                  <Button onClick={downloadICalendar} variant="outline" className="w-full border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm">
                    <Download className="w-3 h-3 mr-2" />
                    Scarica File .ics
                  </Button>
                </CardContent>
              </Card>
            </div>
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
