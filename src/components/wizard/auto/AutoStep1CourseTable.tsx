
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Zap, CheckCircle } from "lucide-react";
import { CourseData, Lesson, ParsedCalendar } from '@/types/course';

interface AutoStep1CourseTableProps {
  data: CourseData;
  updateData: (updates: Partial<CourseData>) => void;
  onNext: () => void;
}

const AutoStep1CourseTable = ({ data, updateData, onNext }: AutoStep1CourseTableProps) => {
  const [courseTable, setCourseTable] = useState('');
  const [teacherCF, setTeacherCF] = useState(data.teacherCF);
  const [location, setLocation] = useState(data.location);
  const [organization, setOrganization] = useState('AKG-grup srl');
  const [isParsed, setIsParsed] = useState(false);

  const parseScheduleText = (scheduleText: string): Lesson[] => {
    const lessons: Lesson[] = [];
    const lines = scheduleText.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      const dateTimeMatch = line.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if (dateTimeMatch) {
        const [, dateStr, startTime, endTime] = dateTimeMatch;
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        const startMin = parseInt(startTime.split(':')[1]);
        const endMin = parseInt(endTime.split(':')[1]);
        
        let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        
        // Sottrai pausa pranzo se presente
        if (startHour <= 13 && endHour >= 14) {
          totalMinutes -= 60; // Sottrai 1 ora di pausa pranzo
        }
        
        const hours = totalMinutes / 60;
        
        lessons.push({
          subject: 'Lezione',
          date: dateStr,
          startTime,
          endTime,
          location: 'Ufficio',
          hours
        });
      }
    });
    
    return lessons;
  };

  const calculateParsedCalendar = (lessons: Lesson[]): ParsedCalendar => {
    if (lessons.length === 0) {
      return {
        startDate: null,
        endDate: null,
        totalHours: 0,
        presenceHours: 0,
        onlineHours: 0,
        lessons: []
      };
    }

    const dates = lessons.map(lesson => {
      const [day, month, year] = lesson.date.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    });

    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const totalHours = lessons.reduce((sum, lesson) => sum + lesson.hours, 0);
    const presenceHours = lessons
      .filter(lesson => lesson.location === 'Ufficio')
      .reduce((sum, lesson) => sum + lesson.hours, 0);
    const onlineHours = lessons
      .filter(lesson => lesson.location === 'Online')
      .reduce((sum, lesson) => sum + lesson.hours, 0);

    return {
      startDate,
      endDate,
      totalHours,
      presenceHours,
      onlineHours,
      lessons
    };
  };

  const parseCourseTable = () => {
    const lines = courseTable.trim().split('\n');
    if (lines.length < 2) {
      alert('Formato tabella non valido. Assicurati di aver copiato correttamente la tabella.');
      return;
    }

    // Trova la riga con i dati del corso (quella che inizia con il nome del corso)
    let dataLineIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Controlla se la riga contiene i dati del corso (non dovrebbe iniziare con una data)
      if (!line.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        dataLineIndex = i;
        break;
      }
    }

    if (dataLineIndex === -1) {
      alert('Non riesco a trovare la riga con i dati del corso. Verifica il formato della tabella.');
      return;
    }

    const dataLine = lines[dataLineIndex];
    const columns = dataLine.split('\t').map(col => col.trim());

    console.log('Colonne trovate:', columns.length, columns);

    if (columns.length < 4) {
      alert('Tabella incompleta. Assicurati che contenga almeno le colonne: Corso, ID Corso, ID Sezione, Quando.');
      return;
    }

    const courseName = columns[0] || '';
    const projectId = columns[1] || '';
    const sectionId = columns[2] || '';
    
    // Raccogli tutte le righe del calendario dalla riga successiva fino alla fine o fino alla prossima riga con dati
    let scheduleLines = [];
    for (let i = dataLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && line.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        scheduleLines.push(line);
      } else if (line && !line.match(/^\d{2}\/\d{2}\/\d{4}/) && scheduleLines.length > 0) {
        // Se troviamo una riga che non è una data e abbiamo già raccolto date, 
        // potrebbe essere la riga con il provider e altre info
        const extraColumns = line.split('\t');
        if (extraColumns.length > 0 && !columns[4]) {
          // Se non abbiamo ancora il provider, prendiamolo da qui
          columns[4] = extraColumns[0]; // Provider/Docente
        }
        break;
      }
    }

    // Se non abbiamo trovato il provider nella riga separata, potrebbe essere nella stessa riga dei dati
    const mainTeacher = columns[4] || '';
    
    const scheduleText = scheduleLines.join('\n');
    console.log('Calendario estratto:', scheduleText);
    console.log('Docente:', mainTeacher);

    // Parse del calendario dalle date/orari
    const lessons = parseScheduleText(scheduleText);
    const parsedCalendar = calculateParsedCalendar(lessons);

    // Genera il formato calendario testuale per compatibilità
    const calendar = lessons.map(lesson => 
      `${lesson.subject} - ${lesson.date} ${lesson.startTime} - ${lesson.endTime} - ${lesson.location}`
    ).join('\n');

    updateData({
      projectId,
      sectionId,
      courseName,
      location,
      mainTeacher,
      teacherCF,
      operation: organization,
      calendar,
      parsedCalendar
    });

    setIsParsed(true);
    console.log('Dati corso parsati:', { courseName, projectId, sectionId, mainTeacher, totalLessons: lessons.length });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isParsed) {
      alert('Prima elabora la tabella del corso');
      return;
    }
    if (!teacherCF || !location) {
      alert('Compila il Codice Fiscale docente e seleziona la sede');
      return;
    }
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="w-5 h-5 mr-2 text-green-500" />
          Tabella del Corso - Parsing Automatico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Formato tabella atteso:</h3>
            <p className="text-sm text-green-700 mb-2">
              Copia e incolla la tabella con le colonne nel seguente ordine:
            </p>
            <code className="text-xs bg-white p-2 rounded block">
              Corso | ID Corso | ID Sezione | Quando | Provider | Tipo di sede | # Sessioni | Ore Totali | Durata | Rendicontabile | Capienza | Stato
            </code>
          </div>

          <div>
            <Label htmlFor="courseTable">Tabella del Corso</Label>
            <Textarea
              id="courseTable"
              value={courseTable}
              onChange={(e) => setCourseTable(e.target.value)}
              placeholder="Incolla qui la tabella del corso copiata dal sistema..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              onClick={parseCourseTable}
              variant="outline"
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-2" />
              Elabora Tabella Corso
            </Button>
          </div>

          {isParsed && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-900">✅ Tabella Elaborata</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Corso:</strong> {data.courseName}
                </div>
                <div>
                  <strong>ID Corso:</strong> {data.projectId}
                </div>
                <div>
                  <strong>ID Sezione:</strong> {data.sectionId}
                </div>
                <div>
                  <strong>Docente:</strong> {data.mainTeacher}
                </div>
                <div>
                  <strong>Lezioni:</strong> {data.parsedCalendar.lessons.length}
                </div>
                <div>
                  <strong>Ore Totali:</strong> {data.parsedCalendar.totalHours}
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="teacherCF">Codice Fiscale Docente *</Label>
              <Input
                id="teacherCF"
                value={teacherCF}
                onChange={(e) => setTeacherCF(e.target.value.toUpperCase())}
                placeholder="RSSMRA80A01H501Z"
                maxLength={16}
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Sede del Corso *</Label>
              <Select value={location} onValueChange={setLocation} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona sede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Porta Venezia">Porta Venezia</SelectItem>
                  <SelectItem value="Porta Romana">Porta Romana</SelectItem>
                  <SelectItem value="Stazione Centrale">Stazione Centrale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="organization">Ente/Organizzazione</Label>
            <Input
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="AKG-grup srl"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Avanti
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AutoStep1CourseTable;
