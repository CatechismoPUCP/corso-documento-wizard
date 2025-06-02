
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, MapPin, Edit, Lock, Unlock } from "lucide-react";
import { CourseData, ParsedCalendar } from '@/types/course';
import { parseScheduleText, calculateParsedCalendar } from '@/utils/courseTableParser';

interface Step3SummaryProps {
  data: CourseData;
  updateData: (updates: Partial<CourseData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step3Summary = ({ data, updateData, onNext, onPrev }: Step3SummaryProps) => {
  const [isCalendarLocked, setIsCalendarLocked] = useState(true);
  const [isParticipantsLocked, setIsParticipantsLocked] = useState(true);
  const [editableCalendar, setEditableCalendar] = useState(data.calendar);

  const parseCalendar = (calendarText: string): ParsedCalendar => {
    const lessons = parseScheduleText(calendarText);
    return calculateParsedCalendar(lessons);
  };

  useEffect(() => {
    if (data.calendar && !data.parsedCalendar.lessons.length) {
      const parsed = parseCalendar(data.calendar);
      updateData({ parsedCalendar: parsed });
    }
  }, []); // Rimuovo data.calendar dalle dipendenze per evitare loop infinito

  const handleCalendarUpdate = () => {
    const parsed = parseCalendar(editableCalendar);
    updateData({ 
      calendar: editableCalendar,
      parsedCalendar: parsed 
    });
    setIsCalendarLocked(true);
  };

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
                  <span className="font-semibold">ID Corso:</span>
                  <p className="font-mono text-sm">{data.projectId}</p>
                </div>
                <div>
                  <span className="font-semibold">ID Sezione:</span>
                  <p className="font-mono text-sm">{data.sectionId}</p>
                </div>
                <div>
                  <span className="font-semibold">Docente Principale:</span>
                  <p>{data.mainTeacher}</p>
                </div>
                <div>
                  <span className="font-semibold">Codice Fiscale Docente:</span>
                  <p className="font-mono text-sm">{data.teacherCF || 'Non specificato'}</p>
                </div>
                <div>
                  <span className="font-semibold">Sede:</span>
                  <p>{data.location}</p>
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
                  <p className="text-lg font-semibold text-blue-600">{data.parsedCalendar.presenceHours}h</p>
                </div>
                <div>
                  <span className="font-semibold">Ore a Distanza:</span>
                  <p className="text-lg font-semibold text-green-600">{data.parsedCalendar.onlineHours}h</p>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card className="bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Partecipanti
                  <div className="ml-auto flex items-center space-x-2">
                    {isParticipantsLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    <Switch
                      checked={!isParticipantsLocked}
                      onCheckedChange={(checked) => setIsParticipantsLocked(!checked)}
                    />
                  </div>
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
                {!isParticipantsLocked && data.participants.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold mb-2">Lista Corsisti:</h4>
                    <div className="max-h-32 overflow-y-auto text-sm">
                      {data.participants.map((participant, index) => (
                        <div key={participant.id} className="flex justify-between py-1 border-b">
                          <span>{index + 1}. {participant.cognome} {participant.nome}</span>
                          <span className="text-xs text-gray-500">{participant.benefits}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calendar Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Edit className="w-5 h-5 mr-2" />
                  Modifica Calendario
                </div>
                <div className="flex items-center space-x-2">
                  {isCalendarLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  <Switch
                    checked={!isCalendarLocked}
                    onCheckedChange={(checked) => setIsCalendarLocked(!checked)}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isCalendarLocked && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Formato richiesto:</h3>
                    <code className="text-xs bg-white p-2 rounded block">
                      Materia - DD/MM/YYYY HH:MM - HH:MM - Modalità
                    </code>
                    <p className="text-sm text-blue-700 mt-2">
                      Modalità: "Ufficio" per presenza, "Online" per distanza
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="calendarEdit">Calendario Lezioni</Label>
                    <Textarea
                      id="calendarEdit"
                      value={editableCalendar}
                      onChange={(e) => setEditableCalendar(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={handleCalendarUpdate}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Aggiorna Calendario
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
                          <td className="p-2 font-medium">{lesson.subject}</td>
                          <td className="p-2">{lesson.date}</td>
                          <td className="p-2">{lesson.startTime} - {lesson.endTime}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              lesson.location === 'Ufficio' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {lesson.location === 'Ufficio' ? '🏢 Presenza' : '💻 Online'}
                            </span>
                          </td>
                          <td className="p-2 font-semibold">{lesson.hours}h</td>
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
