
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Users, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { CourseData, Participant } from '@/types/course';

interface Step2ParticipantsProps {
  data: CourseData;
  updateData: (updates: Partial<CourseData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const Step2Participants = ({ data, updateData, onNext, onPrev }: Step2ParticipantsProps) => {
  const [participantsText, setParticipantsText] = useState('');

  const parseParticipants = (text: string): Participant[] => {
    const lines = text.trim().split('\n');
    const participants: Participant[] = [];
    
    // Skip header line if present
    const dataLines = lines.filter(line => line.trim() && !line.includes('COGNOME') && !line.includes('N.'));
    
    dataLines.forEach((line, index) => {
      const columns = line.split('\t').map(col => col.trim());
      
      if (columns.length >= 15) { // Minimum required columns
        participants.push({
          id: index + 1,
          cognome: columns[2] || '', // Fixed: was taking from column 1, now from column 2
          nome: columns[3] || '', // Fixed: was taking from column 2, now from column 3
          genere: columns[4] || '',
          dataNascita: columns[5] || '',
          comuneNascita: columns[6] || '',
          provNascita: columns[7] || '',
          cittadinanza: columns[8] || '',
          codiceFiscale: columns[1] || '', // Fixed: now correctly taking codice fiscale from column 1
          titoloStudio: columns[9] || '',
          cellulare: columns[10] || '', // This should now correctly get the smartphone number
          email: columns[11] || '',
          comuneDomicilio: columns[12] || '',
          provDomicilio: columns[13] || '',
          indirizzo: columns[14] || '',
          cap: columns[15] || '',
          benefits: columns[16] === 'SI' || columns[16] === 'Yes' || columns[16] === 'Sì' ? 'SI' : 'NO', // Parse benefits
          caseManager: columns[17] || '' // Case manager information
        });
      }
    });
    
    return participants;
  };

  const handleParseParticipants = () => {
    const parsed = parseParticipants(participantsText);
    updateData({ participants: parsed });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
              N. | Codice Fiscale | COGNOME | NOME | Genere | Data nascita | Comune nascita | Prov nascita | 
              Cittadinanza | Titolo di studio | Cellulare | Mail | 
              Comune domicilio | Prov domicilio | Via e n. civico | CAP | Benefits | Case Manager
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
              Elabora Tabella ({participantsText ? 'Testo inserito' : 'Vuoto'})
            </Button>
          </div>

          {data.participants.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-4">
                ✅ Partecipanti Caricati: {data.participants.length}
              </h3>
              
              <div className="bg-yellow-50 p-3 rounded mb-4">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚡ Ordina i partecipanti: L'ordine qui determinerà l'ordine nei documenti finali
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b">
                      <th className="text-left p-2 w-12">#</th>
                      <th className="text-left p-2">Cognome</th>
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">CF</th>
                      <th className="text-left p-2">Cellulare</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Benefits</th>
                      <th className="text-left p-2 w-20">Ordine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.participants.map((participant, index) => (
                      <tr key={participant.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-bold">{index + 1}</td>
                        <td className="p-2">{participant.cognome}</td>
                        <td className="p-2">{participant.nome}</td>
                        <td className="p-2 font-mono text-xs">{participant.codiceFiscale}</td>
                        <td className="p-2 text-xs">{participant.cellulare}</td>
                        <td className="p-2 text-xs">{participant.email}</td>
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
