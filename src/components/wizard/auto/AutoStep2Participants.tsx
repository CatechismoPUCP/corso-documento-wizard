
import React from 'react';
import Step2Participants from '../Step2Participants';
import { CourseData } from '@/types/course';

interface AutoStep2ParticipantsProps {
  data: CourseData;
  updateData: (updates: Partial<CourseData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const AutoStep2Participants = ({ data, updateData, onNext, onPrev }: AutoStep2ParticipantsProps) => {
  // Riutilizziamo il componente esistente per i partecipanti
  // In futuro potremmo aggiungere funzionalità specifiche per il wizard automatico
  return (
    <Step2Participants 
      data={data} 
      updateData={updateData} 
      onNext={onNext} 
      onPrev={onPrev} 
    />
  );
};

export default AutoStep2Participants;
