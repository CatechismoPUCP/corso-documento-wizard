/**
 * Automatic Course Wizard component that provides rapid course creation
 * by parsing pasted course table data automatically.
 */
import React, { useState } from 'react';
import WizardBase, { WizardStep } from './wizard/WizardBase';
import AutoStep1CourseTable from './wizard/auto/AutoStep1CourseTable';
import AutoStep2Participants from './wizard/auto/AutoStep2Participants';
import Step3Summary from './wizard/Step3Summary';
import Step4Generation from './wizard/Step4Generation';
import { CourseData } from '@/types/course';

interface AutomaticWizardProps {
  onBack: () => void;
}

/**
 * Automatic Course Wizard - provides rapid course creation through
 * automatic parsing of pasted course table data.
 */
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
      lessons: []
    }
  });

  const steps: WizardStep[] = [
    { number: 1, title: "Tabella Corso", description: "Incolla tabella automatica" },
    { number: 2, title: "Partecipanti", description: "Lista corsisti" },
    { number: 3, title: "Riepilogo", description: "Verifica dati estratti" },
    { number: 4, title: "Generazione", description: "Crea documenti" }
  ];

  /** Updates course data with partial updates */
  const updateCourseData = (updates: Partial<CourseData>) => {
    setCourseData(prev => ({ ...prev, ...updates }));
  };

  /** Advances to the next step if not at the end */
  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  /** Goes back to the previous step if not at the beginning */
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  /** Resets wizard to initial state */
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
        lessons: []
      }
    });
  };

  /** Renders the appropriate step component based on current step */
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
    <WizardBase
      currentStep={currentStep}
      steps={steps}
      title="Wizard Automatico - Generazione Rapida"
      onBack={onBack}
      theme="green"
    >
      {renderStep()}
    </WizardBase>
  );
};

export default AutomaticWizard;
