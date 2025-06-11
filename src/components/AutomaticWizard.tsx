import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import AutoStep1CourseTable from './wizard/auto/AutoStep1CourseTable';
import AutoStep2Participants from './wizard/auto/AutoStep2Participants';
import Step3Summary from './wizard/Step3Summary';
import Step4Generation from './wizard/Step4Generation';
import { CourseData } from '@/types/course';

interface AutomaticWizardProps {
  onBack: () => void;
}

const AutomaticWizard = ({ onBack }: AutomaticWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [courseData, setCourseData] = useState<CourseData>({
    projectId: '',
    sectionId: '',
    courseName: '',
    location: '',
    mainTeacher: '',
    teacherCF: '',
    operation: '',
    calendar: '',
    participants: [],
    parsedCalendar: {
      startDate: null,
      endDate: null,
      totalHours: 0,
      presenceHours: 0,
      onlineHours: 0,
      fadHours: 0,
      lessons: []
    }
  });

  const steps = [
    { number: 1, title: "Tabella Corso", description: "Incolla tabella automatica" },
    { number: 2, title: "Partecipanti", description: "Lista corsisti" },
    { number: 3, title: "Riepilogo", description: "Verifica dati estratti" },
    { number: 4, title: "Generazione", description: "Crea documenti" }
  ];

  const updateCourseData = (updates: Partial<CourseData>) => {
    setCourseData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setCourseData({
      projectId: '',
      sectionId: '',
      courseName: '',
      location: '',
      mainTeacher: '',
      teacherCF: '',
      operation: '',
      calendar: '',
      participants: [],
      parsedCalendar: {
        startDate: null,
        endDate: null,
        totalHours: 0,
        presenceHours: 0,
        onlineHours: 0,
        fadHours: 0,
        lessons: []
      }
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <AutoStep1CourseTable data={courseData} updateData={updateCourseData} onNext={nextStep} />;
      case 2:
        return <AutoStep2Participants data={courseData} updateData={updateCourseData} onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <Step3Summary data={courseData} updateData={updateCourseData} onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <Step4Generation data={courseData} onReset={resetWizard} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="outline" onClick={onBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Torna alla Home
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Wizard Automatico - Generazione Rapida
            </h1>
          </div>

          {/* Progress Steps */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Passaggio {currentStep} di 4</CardTitle>
                <span className="text-sm text-gray-500">
                  {Math.round((currentStep / 4) * 100)}% completato
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className={`text-center p-3 rounded-lg border ${
                      step.number === currentStep
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : step.number < currentStep
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    <div className="font-semibold text-sm">{step.title}</div>
                    <div className="text-xs mt-1">{step.description}</div>
                  </div>
                ))}
              </div>
            </CardHeader>
          </Card>

          {/* Step Content */}
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default AutomaticWizard;
