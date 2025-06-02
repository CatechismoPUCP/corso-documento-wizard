import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Users, Upload, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { CourseData, Participant } from '@/types/course';

interface Step2ParticipantsProps {
  data: CourseData;
  updateData: (updates: Partial<CourseData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step2Participants = ({ data, updateData, onNext, onPrev }: Step2ParticipantsProps) => {
  const [participantsText, setParticipantsText] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const parseParticipants = (text: string): Participant[] => {
    console.log('Starting to parse participants text:', text);
    const lines = text.trim().split('\n');
    const participants: Participant[] = [];
    
    // Skip header line and footer line
    const dataLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             !trimmed.toLowerCase().includes('id') &&
             !trimmed.toLowerCase().includes('codice fiscale') &&
             !trimmed.toLowerCase().includes('nome') &&
             !trimmed.toLowerCase().includes('righe visualizzata');
    });
    
    console.log('Data lines to process:', dataLines.length);
    
    dataLines.forEach((line, index) => {
      const columns = line.split('\t').map(col => col.trim());
      console.log(`Processing line ${index + 1}:`, columns);
      
      // Your table format has 13 columns:
      // ID | Codice Fiscale | Nome | Telefono/i | Cellulare | Indirizzo email | Programma | Ufficio | Case Manager | Benefits | Presenza dell'utente | Dettagli | Frequenza
      if (columns.length >= 10) { // Minimum required columns for your format
        // Extract nome and cognome from the combined name field (column 2)
        const fullName = columns[2] || '';
        const nameParts = fullName.trim().split(' ');
        const nome = nameParts[0] || '';
        const cognome = nameParts.slice(1).join(' ') || '';
        
        const participant: Participant = {
          id: index + 1,
          cognome: cognome,
          nome: nome,
          genere: '', // Not available in this format
          dataNascita: '', // Not available in this format
          comuneNascita: '', // Not available in this format
          provNascita: '', // Not available in this format
          cittadinanza: '', // Not available in this format
          codiceFiscale: columns[1] || '',
          titoloStudio: '', // Not available in this format
          cellulare: columns[4] || '', // Cellulare column
          email: columns[5] || '', // Indirizzo email column
          comuneDomicilio: '', // Not available in this format
          provDomicilio: '', // Not available in this format
          indirizzo: '', // Not available in this format
          cap: '', // Not available in this format
          benefits: (columns[9] === 'Sì' || columns[9] === 'Si' || columns[9] === 'SI' || columns[9] === 'Yes') ? 'SI' : 'NO', // Benefits column
          caseManager: columns[8] || '' // Case Manager column
        };
        
        console.log(`Created participant ${index + 1}:`, participant);
        participants.push(participant);
      } else {
        console.log(`Line ${index + 1} skipped - not enough columns (${columns.length})`);
      }
    });
    
    console.log('Total participants parsed:', participants.length);
    return participants;
  };

  const handleParseParticipants = () => {
    console.log('Parsing participants...');
    if (!participantsText.trim()) {
      alert('Inserisci il testo della tabella partecipanti');
      return;
    }
    
    const parsed = parseParticipants(participantsText);
    console.log('Parsed participants:', parsed);
    
    if (parsed.length === 0) {
      alert('Nessun partecipante valido trovato. Verifica il formato della tabella.');
      return;
    }
    
    updateData({ participants: parsed });
    console.log('Updated data with participants:', parsed);
  };

  const moveParticipant = (index: number, direction: 'up' | 'down') => {
    const newParticipants = [...data.participants];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newParticipants.length) {
      // Swap participants
      [newParticipants[index], newParticipants[targetIndex]] = [newParticipants[targetIndex], newParticipants[index]];
      // Update IDs to maintain order
      newParticipants.forEach((participant, idx) => {
        participant.id = idx + 1;
      });
      updateData({ participants: newParticipants });
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newParticipants = [...data.participants];
    const draggedParticipant = newParticipants[draggedIndex];
    
    // Remove dragged participant
    newParticipants.splice(draggedIndex, 1);
    
    // Insert at new position
    newParticipants.splice(dropIndex, 0, draggedParticipant);
    
    // Update IDs to maintain order
    newParticipants.forEach((participant, idx) => {
      participant.id = idx + 1;
    });
    
    updateData({ participants: newParticipants });
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting with participants:', data.participants.length);
    if (data.participants.length === 0) {
      alert('Inserisci almeno un partecipante');
      return;
    }
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Lista Partecipanti/Corsisti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Formato atteso per la tabella:</h3>
            <p className="text-sm text-blue-700 mb-2">
              Copia e incolla la tabella con le colonne separate da TAB nel seguente ordine:
            </p>
            <code className="text-xs bg-white p-2 rounded block">
              ID | Codice Fiscale | Nome | Telefono/i | Cellulare | Indirizzo email | 
              Programma | Ufficio | Case Manager | Benefits | Presenza dell'utente | Dettagli | Frequenza
            </code>
          </div>

          <div>
            <Label htmlFor="participantsTable">Tabella Partecipanti</Label>
            <Textarea
              id="participantsTable"
              value={participantsText}
              onChange={(e) => setParticipantsText(e.target.value)}
              placeholder="Incolla qui la tabella dei partecipanti copiata da Excel..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              onClick={handleParseParticipants}
              variant="outline"
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Elabora Tabella ({participantsText.trim() ? 'Testo inserito' : 'Vuoto'})
            </Button>
          </div>

          {data.participants.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-4">
                ✅ Partecipanti Caricati: {data.participants.length}
              </h3>
              
              <div className="bg-yellow-50 p-3 rounded mb-4">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚡ Ordina i partecipanti: Usa i pulsanti freccia o trascina le righe per riordinare
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b">
                      <th className="text-left p-2 w-8">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </th>
                      <th className="text-left p-2 w-12">#</th>
                      <th className="text-left p-2">Cognome</th>
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">CF</th>
                      <th className="text-left p-2">Cellulare</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Case Manager</th>
                      <th className="text-left p-2">Benefits</th>
                      <th className="text-left p-2 w-20">Ordine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.participants.map((participant, index) => (
                      <tr 
                        key={`${participant.id}-${index}`}
                        className={`border-b hover:bg-gray-50 cursor-move ${
                          draggedIndex === index ? 'opacity-50' : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <td className="p-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                        </td>
                        <td className="p-2 font-bold">{index + 1}</td>
                        <td className="p-2">{participant.cognome}</td>
                        <td className="p-2">{participant.nome}</td>
                        <td className="p-2 font-mono text-xs">{participant.codiceFiscale}</td>
                        <td className="p-2 text-xs">{participant.cellulare}</td>
                        <td className="p-2 text-xs">{participant.email}</td>
                        <td className="p-2 text-sm">{participant.caseManager}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            participant.benefits === 'SI' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {participant.benefits}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => moveParticipant(index, 'up')}
                              disabled={index === 0}
                              className="p-1 h-8 w-8"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => moveParticipant(index, 'down')}
                              disabled={index === data.participants.length - 1}
                              className="p-1 h-8 w-8"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button type="button" onClick={onPrev} variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Indietro
            </Button>
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

export default Step2Participants;
