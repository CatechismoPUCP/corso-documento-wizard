
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, MapPin } from "lucide-react";
import { CourseData, ParsedCalendar } from '@/types/course';

interface Step3SummaryProps {
  data: CourseData;
  updateData: (updates: Partial<CourseData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step3Summary = ({ data, updateData, onNext, onPrev }: Step3SummaryProps) => {
  const parseCalendar = (calendarText: string): ParsedCalendar => {
    const lines = calendarText.trim().split('\n').filter(line => line.trim());
    const lessons = [];
    let totalHours = 0;
    let presenceHours = 0;
    let onlineHours = 0;
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    for (const line of lines) {
      // Parse format: "Materia - GG/MM/AAAA HH:MM - HH:MM - Ufficio/Online"
      const match = line.match(/^(.+?)\s*-\s*(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*-\s*(Ufficio|Online)$/i);
      
      if (match) {
        const [, subject, dateStr, startTime, endTime, location] = match;
        
        // Parse date
        const [day, month, year] = dateStr.split('/');
        const lessonDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Calculate hours (excluding lunch break 13:00-14:00)
        const start = parseInt(startTime.split(':')[0]);
        const end = parseInt(endTime.split(':')[0]);
        let hours = end - start;
        
        // Subtract lunch break if lesson spans across it
        if (start < 13 && end > 14) {
          hours -= 1; // Remove lunch hour
        }
        
        const lesson = {
          subject: subject.trim(),
          date: dateStr,
          startTime,
          endTime,
          location: location as 'Ufficio' | 'Online',
          hours
        };
        
        lessons.push(lesson);
        totalHours += hours;
        
        if (location.toLowerCase() === 'ufficio') {
          presenceHours += hours;
        } else {
          onlineHours += hours;
        }
        
        // Track date range
        if (!startDate || lessonDate < startDate) {
          startDate = lessonDate;
        }
        if (!endDate || lessonDate > endDate) {
          endDate = lessonDate;
        }
      }
    }

    return {
      startDate,
      endDate,
      totalHours,
      presenceHours,
      onlineHours,
      lessons
    };
  };

  useEffect(() => {
    if (data.calendar) {
      const parsed = parseCalendar(data.calendar);
      updateData({ parsedCalendar: parsed });
    }
  }, [data.calendar, updateData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const formatDate = (date: Date | null) => {
    return date ? date.toLocaleDateString('it-IT') : 'N/A';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riepilogo e Conferma Dati Estratti</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Course Info */}
            <Card className="bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Informazioni Corso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-semibold">Nome Corso:</span>
                  <p>{data.courseName}</p>
                </div>
                <div>
                  <span className="font-semibold">ID Sezione:</span>
                  <p>{data.sectionId}</p>
                </div>
                <div>
                  <span className="font-semibold">Docente Principale:</span>
                  <p>{data.mainTeacher}</p>
                </div>
                <div>
                  <span className="font-semibold">Codice Fiscale:</span>
                  <p className="font-mono text-sm">{data.teacherCF}</p>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Analysis */}
            <Card className="bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Analisi Calendario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-semibold">Data Inizio:</span>
                  <p>{formatDate(data.parsedCalendar.startDate)}</p>
                </div>
                <div>
                  <span className="font-semibold">Data Fine:</span>
                  <p>{formatDate(data.parsedCalendar.endDate)}</p>
                </div>
                <div>
                  <span className="font-semibold">Lezioni Programmate:</span>
                  <p>{data.parsedCalendar.lessons.length}</p>
                </div>
              </CardContent>
            </Card>

            {/* Hours Breakdown */}
            <Card className="bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Ripartizione Ore
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-semibold">Totale Ore Previste:</span>
                  <p className="text-2xl font-bold text-purple-700">{data.parsedCalendar.totalHours}h</p>
                </div>
                <div>
                  <span className="font-semibold">Ore in Presenza:</span>
                  <p>{data.parsedCalendar.presenceHours}h</p>
                </div>
                <div>
                  <span className="font-semibold">Ore a Distanza:</span>
                  <p>{data.parsedCalendar.onlineHours}h</p>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card className="bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Partecipanti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-semibold">Numero Partecipanti:</span>
                  <p className="text-2xl font-bold text-orange-700">{data.participants.length}</p>
                </div>
                <div>
                  <span className="font-semibold">Lista Caricata:</span>
                  <p>{data.participants.length > 0 ? '✅ Sì' : '❌ No'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lessons Preview */}
          {data.parsedCalendar.lessons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Anteprima Lezioni</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Materia</th>
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Orario</th>
                        <th className="text-left p-2">Modalità</th>
                        <th className="text-left p-2">Ore</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.parsedCalendar.lessons.map((lesson, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{lesson.subject}</td>
                          <td className="p-2">{lesson.date}</td>
                          <td className="p-2">{lesson.startTime} - {lesson.endTime}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              lesson.location === 'Ufficio' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {lesson.location}
                            </span>
                          </td>
                          <td className="p-2">{lesson.hours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button type="button" onClick={onPrev} variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Indietro
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Conferma e Vai ai Report
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Step3Summary;
