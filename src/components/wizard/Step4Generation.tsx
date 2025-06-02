import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, RotateCcw, Download, Share2, Users, ExternalLink, UserCheck } from "lucide-react";
import { CourseData } from '@/types/course';
import StudentsContactTable from './StudentsContactTable';
import { generateAttendanceExcel } from '@/utils/attendanceExcelUtils';
import { generateExcelCalendar } from '@/utils/calendarExcelUtils';
import { generateWordReport, generateSampleData } from '@/utils/otherExportsUtils';
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateTeamsUrl,
  downloadICalendar
} from '@/utils/calendarUtils';

interface Step4GenerationProps {
  data: CourseData;
  onReset: () => void;
}

const Step4Generation = ({ data, onReset }: Step4GenerationProps) => {
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
                  <Button onClick={() => generateWordReport(data)} className="w-full bg-blue-600 hover:bg-blue-700">
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
                    colonne per ogni giorno di lezione con modalità (Ufficio/Online), totali e progressive.
                  </p>
                  <Button onClick={() => generateAttendanceExcel(data)} className="w-full bg-green-600 hover:bg-green-700">
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
                  <Button onClick={() => generateExcelCalendar(data)} className="w-full bg-purple-600 hover:bg-purple-700">
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
                    <Button onClick={() => generateGoogleCalendarUrl(data)} className="w-full bg-red-600 hover:bg-red-700 text-sm">
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
                    <Button onClick={() => generateOutlookCalendarUrl(data)} className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
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
                    <Button onClick={() => generateTeamsUrl(data)} className="w-full bg-purple-600 hover:bg-purple-700 text-sm">
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
                    <Button onClick={() => downloadICalendar(data)} variant="outline" className="w-full border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-sm">
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
                <Button onClick={() => generateSampleData(data)} variant="outline" className="w-full">
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
