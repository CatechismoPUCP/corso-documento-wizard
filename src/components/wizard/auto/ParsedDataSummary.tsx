
import React from 'react';
import { CheckCircle } from "lucide-react";
import { CourseData } from '@/types/course';

interface ParsedDataSummaryProps {
  data: CourseData;
}

const ParsedDataSummary = ({ data }: ParsedDataSummaryProps) => {
  return (
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
  );
};

export default ParsedDataSummary;
