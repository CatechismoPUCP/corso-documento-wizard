
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight } from "lucide-react";
import { CourseData } from '@/types/course';

interface Step1CourseDataProps {
  data: CourseData;
  updateData: (updates: Partial<CourseData>) => void;
  onNext: () => void;
}

const Step1CourseData = ({ data, updateData, onNext }: Step1CourseDataProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!data.projectId || !data.sectionId || !data.courseName || !data.mainTeacher) {
      alert('Compila tutti i campi obbligatori');
      return;
    }
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dati del Corso e Calendario</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectId">ID Progetto *</Label>
              <Input
                id="projectId"
                value={data.projectId}
                onChange={(e) => updateData({ projectId: e.target.value })}
                placeholder="Es. PROJ-2024-001"
                required
              />
            </div>
            <div>
              <Label htmlFor="sectionId">ID Sezione *</Label>
              <Input
                id="sectionId"
                value={data.sectionId}
                onChange={(e) => updateData({ sectionId: e.target.value })}
                placeholder="Es. SEZ-A-001"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="courseName">Nome del Corso *</Label>
            <Input
              id="courseName"
              value={data.courseName}
              onChange={(e) => updateData({ courseName: e.target.value })}
              placeholder="Es. Corso di Formazione Professionale"
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Luogo/Sede Principale del Corso</Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => updateData({ location: e.target.value })}
              placeholder="Indirizzo completo della sede"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mainTeacher">Nome Docente Principale *</Label>
              <Input
                id="mainTeacher"
                value={data.mainTeacher}
                onChange={(e) => updateData({ mainTeacher: e.target.value })}
                placeholder="Nome e Cognome"
                required
              />
            </div>
            <div>
              <Label htmlFor="teacherCF">Codice Fiscale Docente *</Label>
              <Input
                id="teacherCF"
                value={data.teacherCF}
                onChange={(e) => updateData({ teacherCF: e.target.value.toUpperCase() })}
                placeholder="RSSMRA80A01H501Z"
                maxLength={16}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="operation">Operation (ID/Codice aggiuntivo)</Label>
            <Input
              id="operation"
              value={data.operation}
              onChange={(e) => updateData({ operation: e.target.value })}
              placeholder="Codice operazione opzionale"
            />
          </div>

          <div>
            <Label htmlFor="calendar">Calendario delle Lezioni</Label>
            <Textarea
              id="calendar"
              value={data.calendar}
              onChange={(e) => updateData({ calendar: e.target.value })}
              placeholder="Incolla qui il calendario nel formato:&#10;Materia - GG/MM/AAAA HH:MM - HH:MM - Ufficio/Online&#10;&#10;Esempio:&#10;Sicurezza sul Lavoro - 15/01/2024 09:00 - 13:00 - Ufficio&#10;Marketing Digitale - 16/01/2024 14:00 - 18:00 - Online"
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Avanti
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Step1CourseData;
