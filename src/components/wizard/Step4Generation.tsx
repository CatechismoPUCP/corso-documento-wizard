
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, RotateCcw, Download } from "lucide-react";
import { CourseData } from '@/types/course';

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
    // TODO: Implement Excel generation logic
    alert('Funzione Excel Calendar in sviluppo');
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
                  oraria, tipologie lezione e informazioni docente.
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
