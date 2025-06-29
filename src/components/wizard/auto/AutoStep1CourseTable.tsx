
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Zap } from "lucide-react";
import { CourseData } from '@/types/course';
import { parseCourseTable, parseScheduleText, calculateParsedCalendar } from '@/utils/courseTableParser';
import CourseTableForm from './CourseTableForm';
import ParsedDataSummary from './ParsedDataSummary';
import TeacherLocationForm from './TeacherLocationForm';

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
  const [linkZoom, setLinkZoom] = useState(data.linkZoom || '');
  const [idRiunione, setIdRiunione] = useState(data.idRiunione || '');
  const [passcode, setPasscode] = useState(data.passcode || '');
  const [isParsed, setIsParsed] = useState(false);

  const handleParseCourseTable = () => {
    const parsedData = parseCourseTable(courseTable);
    
    if (!parsedData || !parsedData.projectId || !parsedData.sectionId || !parsedData.courseName) {
      alert('Impossibile analizzare la tabella. Controlla il formato e assicurati che tutte le colonne necessarie siano presenti.');
      return;
    }

    // Parse del calendario dalle date/orari
    const lessons = parseScheduleText(parsedData.scheduleText);
    const parsedCalendar = calculateParsedCalendar(lessons);
    
    // Usa le ore rendicontabili se disponibili, altrimenti quelle calcolate
    if (parsedData.rendicontabileHours > 0) {
      parsedCalendar.totalHours = parsedData.rendicontabileHours;
      parsedCalendar.presenceHours = parsedData.rendicontabileHours;
    }

    // Genera il formato calendario testuale per compatibilità
    const calendar = lessons.map(lesson => 
      `${lesson.subject} - ${lesson.date} ${lesson.startTime} - ${lesson.endTime} - ${lesson.location}`
    ).join('\n');

    updateData({
      projectId: parsedData.projectId,
      sectionId: parsedData.sectionId,
      courseName: parsedData.courseName,
      location,
      mainTeacher: parsedData.mainTeacher,
      teacherCF,
      operation: organization,
      calendar,
      parsedCalendar,
      linkZoom,
      idRiunione,
      passcode
    });

    setIsParsed(true);
    console.log('Dati corso parsati:', { 
      courseName: parsedData.courseName, 
      projectId: parsedData.projectId, 
      sectionId: parsedData.sectionId, 
      mainTeacher: parsedData.mainTeacher, 
      totalLessons: lessons.length, 
      totalHours: parsedCalendar.totalHours 
    });
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
          <CourseTableForm
            courseTable={courseTable}
            setCourseTable={setCourseTable}
            onParseCourseTable={handleParseCourseTable}
          />

          {isParsed && <ParsedDataSummary data={data} />}

          <TeacherLocationForm
            teacherCF={teacherCF}
            setTeacherCF={setTeacherCF}
            location={location}
            setLocation={setLocation}
            organization={organization}
            setOrganization={setOrganization}
            linkZoom={linkZoom}
            setLinkZoom={setLinkZoom}
            idRiunione={idRiunione}
            setIdRiunione={setIdRiunione}
            passcode={passcode}
            setPasscode={setPasscode}
          />

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
