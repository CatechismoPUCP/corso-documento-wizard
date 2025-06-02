
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface CourseTableFormProps {
  courseTable: string;
  setCourseTable: (value: string) => void;
  onParseCourseTable: () => void;
}

const CourseTableForm = ({ courseTable, setCourseTable, onParseCourseTable }: CourseTableFormProps) => {
  return (
    <>
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
          onClick={onParseCourseTable}
          variant="outline"
          className="flex-1"
        >
          <Zap className="w-4 h-4 mr-2" />
          Elabora Tabella Corso
        </Button>
      </div>
    </>
  );
};

export default CourseTableForm;
