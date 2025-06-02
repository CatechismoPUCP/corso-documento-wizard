import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, RotateCcw, Download, Share2, Users, ExternalLink, UserCheck } from "lucide-react";
import { CourseData } from '@/types/course';
import StudentsContactTable from './StudentsContactTable';
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

  const generateAttendanceExcel = () => {
    console.log('Generating student attendance Excel with data:', data);
    
    try {
      const { attendanceData, lessonDates } = generateAttendanceExcelData();
      
      if (attendanceData.length === 0) {
        alert('Nessun partecipante trovato per generare il foglio presenze.');
        return;
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Create the data structure manually for better control
      const wsData: any[][] = [];
      
      // Header row with course info
      const headerRow = [
        'PROGETTO', 'SEZIONE', 'CORSO', 'INIZIO', 'FINE', 'CODICE', 'CODICE FISCALE', 
        'COGNOME NOME', 'CELLULARE', 'TELEFONO', 'EMAIL', 'DOCUMENTO', 'SCADENZA', 'CASE MANAGER', ''
      ];
      
      // Add lesson date headers
      lessonDates.forEach(date => {
        headerRow.push(date);
      });
      headerRow.push('ORE TOTALI');
      
      wsData.push(headerRow);
      
      // Course info row
      const courseInfoRow = [
        data.projectId, data.sectionId, data.courseName, 
        data.parsedCalendar.startDate?.toLocaleDateString('it-IT') || '',
        data.parsedCalendar.endDate?.toLocaleDateString('it-IT') || '',
        '', '', '', '', '', '', '', '', '', ''
      ];
      
      // Add daily hours for each lesson
      data.parsedCalendar.lessons.forEach(lesson => {
        courseInfoRow.push(lesson.hours.toString());
      });
      courseInfoRow.push(''); // Total column
      
      wsData.push(courseInfoRow);
      
      // Empty row for spacing
      const emptyRow = new Array(headerRow.length).fill('');
      wsData.push(emptyRow);
      
      // Students data
      data.participants.forEach(participant => {
        const studentRow = [
          data.projectId,
          data.sectionId, 
          data.courseName,
          data.parsedCalendar.startDate?.toLocaleDateString('it-IT') || '',
          data.parsedCalendar.endDate?.toLocaleDateString('it-IT') || '',
          participant.id.toString(),
          participant.codiceFiscale,
          `${participant.cognome} ${participant.nome}`,
          participant.cellulare,
          participant.cellulare,
          participant.email,
          '', // Document field
          '', // Expiry field
          participant.caseManager,
          ''  // Empty column
        ];
        
        // Add attendance columns for each lesson (initially empty for manual input)
        data.parsedCalendar.lessons.forEach(() => {
          studentRow.push(''); // Empty cell for attendance input
        });
        
        // Add formula for total hours
        const startCol = 15; // Column P (0-indexed: A=0, B=1, ..., P=15)
        const endCol = startCol + data.parsedCalendar.lessons.length - 1;
        const rowNum = wsData.length + 1; // Excel row number (1-indexed)
        const startColLetter = String.fromCharCode(65 + startCol); // Convert to letter
        const endColLetter = String.fromCharCode(65 + endCol);
        studentRow.push(`=SUM(${startColLetter}${rowNum}:${endColLetter}${rowNum})`);
        
        wsData.push(studentRow);
      });
      
      // Add daily totals row
      const dailyTotalsRow = new Array(15).fill('');
      dailyTotalsRow[7] = 'ORE TOTALI GIORNATA'; // In the name column
      
      data.parsedCalendar.lessons.forEach((_, index) => {
        const colIndex = 15 + index; // Starting from column P
        const colLetter = String.fromCharCode(65 + colIndex);
        const startRow = 4; // First student row (1-indexed)
        const endRow = 3 + data.participants.length; // Last student row
        dailyTotalsRow.push(`=SUM(${colLetter}${startRow}:${colLetter}${endRow})`);
      });
      
      // Total of totals
      const totalStartCol = 15;
      const totalEndCol = totalStartCol + data.parsedCalendar.lessons.length - 1;
      const totalRowNum = wsData.length + 1;
      const totalStartColLetter = String.fromCharCode(65 + totalStartCol);
      const totalEndColLetter = String.fromCharCode(65 + totalEndCol);
      dailyTotalsRow.push(`=SUM(${totalStartColLetter}${totalRowNum}:${totalEndColLetter}${totalRowNum})`);
      
      wsData.push(dailyTotalsRow);
      
      // Add progressive totals row
      const progressiveRow = new Array(15).fill('');
      progressiveRow[7] = 'ORE PROGRESSIVE';
      
      data.parsedCalendar.lessons.forEach((_, index) => {
        const colIndex = 15 + index;
        const colLetter = String.fromCharCode(65 + colIndex);
        const currentRowNum = wsData.length; // Current row for daily totals
        
        if (index === 0) {
          // First progressive = first daily total
          progressiveRow.push(`=${colLetter}${currentRowNum}`);
        } else {
          // Progressive = previous progressive + current daily total
          const prevColLetter = String.fromCharCode(65 + colIndex - 1);
          const nextRowNum = wsData.length + 1; // Next row (progressive row)
          progressiveRow.push(`=${prevColLetter}${nextRowNum}+${colLetter}${currentRowNum}`);
        }
      });
      progressiveRow.push(''); // No total for progressive
      
      wsData.push(progressiveRow);
      
      // Create worksheet from data
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      const colWidths = [
        { wch: 10 }, // PROGETTO
        { wch: 10 }, // SEZIONE
        { wch: 25 }, // CORSO
        { wch: 12 }, // INIZIO
        { wch: 12 }, // FINE
        { wch: 8 },  // CODICE
        { wch: 18 }, // CODICE FISCALE
        { wch: 25 }, // COGNOME NOME
        { wch: 15 }, // CELLULARE
        { wch: 15 }, // TELEFONO
        { wch: 25 }, // EMAIL
        { wch: 12 }, // DOCUMENTO
        { wch: 12 }, // SCADENZA
        { wch: 20 }, // CASE MANAGER
        { wch: 3 },  // Empty column
      ];
      
      // Add columns for each lesson date
      data.parsedCalendar.lessons.forEach(() => {
        colWidths.push({ wch: 10 });
      });
      colWidths.push({ wch: 12 }); // Total column
      
      ws['!cols'] = colWidths;
      
      // Freeze panes at row 4, column O (to keep headers visible)
      ws['!freeze'] = { xSplit: 14, ySplit: 3 };
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Registro Presenze');
      
      // Generate filename
      const filename = `registro_presenze_${data.sectionId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, filename);
      
      console.log('Attendance Excel generated successfully');
    } catch (error) {
      console.error('Error generating attendance Excel:', error);
      alert('Errore durante la generazione del foglio presenze.');
    }
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

    // Create multiple Google Calendar URLs for all lessons
    lessons.forEach((lesson, index) => {
      const [day, month, year] = lesson.date.split('/');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      // Format dates for Google Calendar
      const formatDateForGoogle = (date: Date, time: string) => {
        const [hours, minutes] = time.split(':');
        const newDate = new Date(date);
        newDate.setHours(parseInt(hours), parseInt(minutes));
        return newDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const startDateTime = formatDateForGoogle(startDate, lesson.startTime);
      const endDateTime = formatDateForGoogle(startDate, lesson.endTime);
      
      const title = encodeURIComponent(`${data.courseName} - ${lesson.subject}`);
      const details = encodeURIComponent(`Corso: ${data.courseName}\nDocente: ${data.mainTeacher}\nModalità: ${lesson.location}\nLezione ${index + 1} di ${lessons.length}`);
      const location = encodeURIComponent(lesson.location === 'Ufficio' ? data.location || 'In presenza' : 'Online');

      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
      
      // Open each event in a new tab with a small delay
      setTimeout(() => {
        window.open(googleUrl, '_blank');
      }, index * 500); // 500ms delay between each opening
    });
  };

  const generateOutlookCalendarUrl = () => {
    const lessons = data.parsedCalendar.lessons;
    if (lessons.length === 0) {
      alert('Nessuna lezione trovata per generare il link Outlook.');
      return;
    }

    // Create multiple Outlook Calendar URLs for all lessons
    lessons.forEach((lesson, index) => {
      const [day, month, year] = lesson.date.split('/');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const formatDateForOutlook = (date: Date, time: string) => {
        const [hours, minutes] = time.split(':');
        const newDate = new Date(date);
        newDate.setHours(parseInt(hours), parseInt(minutes));
        return newDate.toISOString();
      };

      const startDateTime = formatDateForOutlook(startDate, lesson.startTime);
      const endDateTime = formatDateForOutlook(startDate, lesson.endTime);
      
      const title = encodeURIComponent(`${data.courseName} - ${lesson.subject}`);
      const body = encodeURIComponent(`Corso: ${data.courseName}\nDocente: ${data.mainTeacher}\nModalità: ${lesson.location}\nLezione ${index + 1} di ${lessons.length}`);
      const location = encodeURIComponent(lesson.location === 'Ufficio' ? data.location || 'In presenza' : 'Online');

      const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDateTime}&enddt=${endDateTime}&body=${body}&location=${location}`;
      
      // Open each event in a new tab with a small delay
      setTimeout(() => {
        window.open(outlookUrl, '_blank');
      }, index * 500); // 500ms delay between each opening
    });
  };

  const generateTeamsUrl = () => {
    const lessons = data.parsedCalendar.lessons.filter(lesson => lesson.location === 'Online');
    if (lessons.length === 0) {
      alert('Nessuna lezione online trovata per generare meeting Teams.');
      return;
    }

    // Create Teams meetings only for online lessons
    lessons.forEach((lesson, index) => {
      const [day, month, year] = lesson.date.split('/');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const title = encodeURIComponent(`${data.courseName} - ${lesson.subject}`);
      const startTime = encodeURIComponent(`${lesson.date} ${lesson.startTime}`);
      const endTime = encodeURIComponent(`${lesson.date} ${lesson.endTime}`);
      
      // Microsoft Teams meeting URL format
      const teamsUrl = `https://teams.microsoft.com/l/meeting/new?subject=${title}&startTime=${startTime}&endTime=${endTime}`;
      
      // Open each meeting in a new tab with a small delay
      setTimeout(() => {
        window.open(teamsUrl, '_blank');
      }, index * 500); // 500ms delay between each opening
    });
  };

  const downloadICalendar = () => {
    const lessons = data.parsedCalendar.lessons;
    if (lessons.length === 0) {
      alert('Nessuna lezione trovata per generare il file calendario.');
      return;
    }

    // Generate iCal format with ALL lessons
    let icalContent = 'BEGIN:VCALENDAR\n';
    icalContent += 'VERSION:2.0\n';
    icalContent += 'PRODID:-//Lovable//Course Calendar//EN\n';
    icalContent += 'CALSCALE:GREGORIAN\n';
    icalContent += `X-WR-CALNAME:${data.courseName}\n`;
    icalContent += `X-WR-CALDESC:Calendario completo del corso ${data.courseName} - ${data.mainTeacher}\n`;

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
      icalContent += `DESCRIPTION:Corso: ${data.courseName}\\nDocente: ${data.mainTeacher}\\nModalità: ${lesson.location}\\nLezione ${index + 1} di ${lessons.length}\n`;
      icalContent += `LOCATION:${lesson.location === 'Ufficio' ? (data.location || 'In presenza') : 'Online'}\n`;
      icalContent += 'STATUS:CONFIRMED\n';
      icalContent += 'SEQUENCE:0\n';
      icalContent += 'END:VEVENT\n';
    });

    icalContent += 'END:VCALENDAR';

    // Download the file
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario_completo_${data.sectionId}.ics`;
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

  const generateAttendanceExcelData = () => {
    // Get unique lesson dates
    const lessonDates = data.parsedCalendar.lessons.map(lesson => lesson.date);
    
    const attendanceData = data.participants.map(participant => {
      const baseInfo = {
        'Progetto': data.projectId,
        'Sezione': data.sectionId,
        'Corso': data.courseName,
        'Inizio': data.parsedCalendar.startDate?.toLocaleDateString('it-IT') || '',
        'Fine': data.parsedCalendar.endDate?.toLocaleDateString('it-IT') || '',
        'Codice': participant.id.toString(),
        'Codice Fiscale': participant.codiceFiscale,
        'Cognome Nome': `${participant.cognome} ${participant.nome}`,
        'Cellulare': participant.cellulare,
        'Telefono': participant.cellulare,
        'Email': participant.email,
        'Case Manager': participant.caseManager
      };

      // Add columns for each lesson date (empty for manual input)
      lessonDates.forEach(date => {
        baseInfo[date] = '';
      });

      return baseInfo;
    });

    return { attendanceData, lessonDates };
  };

  return (
    <div className="space-y-6">
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
            <div className="grid md:grid-cols-3 gap-4">
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
                    <UserCheck className="w-6 h-6 mr-2" />
                    Registro Presenze Excel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Genera un foglio Excel per il registro presenze con tutti i partecipanti,
                    colonne per ogni giorno di lezione, totali giornalieri e progressivi.
                  </p>
                  <Button onClick={generateAttendanceExcel} className="w-full bg-green-600 hover:bg-green-700">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Genera Registro Presenze
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-300 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700">
                    <Calendar className="w-6 h-6 mr-2" />
                    Calendario Excel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Esporta il calendario dettagliato in formato Excel con suddivisione 
                    oraria, tipologie lezione e informazioni docente (formato compatibile sistema).
                  </p>
                  <Button onClick={generateExcelCalendar} className="w-full bg-purple-600 hover:bg-purple-700">
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
                Sincronizza facilmente il calendario del corso con i tuoi servizi preferiti. 
                <strong>Tutte le {data.parsedCalendar.lessons.length} lezioni</strong> verranno aggiunte automaticamente.
              </p>
              
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="border-2 hover:border-red-300 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-red-600 text-base">
                      <Calendar className="w-5 h-5 mr-2" />
                      Google Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-600 mb-3">
                      Aggiungi tutte le {data.parsedCalendar.lessons.length} lezioni al tuo Google Calendar.
                    </p>
                    <Button onClick={generateGoogleCalendarUrl} className="w-full bg-red-600 hover:bg-red-700 text-sm">
                      <ExternalLink className="w-3 h-3 mr-2" />
                      Apri in Google Calendar
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-blue-300 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-blue-600 text-base">
                      <Calendar className="w-5 h-5 mr-2" />
                      Outlook Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-600 mb-3">
                      Aggiungi tutte le {data.parsedCalendar.lessons.length} lezioni al tuo Outlook.
                    </p>
                    <Button onClick={generateOutlookCalendarUrl} className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
                      <ExternalLink className="w-3 h-3 mr-2" />
                      Apri in Outlook
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
                      Crea meeting Teams per le lezioni online ({data.parsedCalendar.lessons.filter(l => l.location === 'Online').length} lezioni).
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
                      Scarica calendario completo con tutte le {data.parsedCalendar.lessons.length} lezioni.
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
      
      {/* Students Contact Table */}
      <StudentsContactTable 
        participants={data.participants} 
        courseName={data.courseName}
      />
    </div>
  );
};

export default Step4Generation;
