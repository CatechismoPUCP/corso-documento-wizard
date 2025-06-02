
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Users, Upload } from "lucide-react";
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
      
      if (columns.length >= 10) { // Minimum required columns
        participants.push({
          id: index + 1,
          cognome: columns[1] || '',
          nome: columns[2] || '',
          genere: columns[3] || '',
          dataNascita: columns[4] || '',
          comuneNascita: columns[5] || '',
          provNascita: columns[6] || '',
          cittadinanza: columns[7] || '',
          codiceFiscale: columns[8] || '',
          titoloStudio: columns[9] || '',
          cellulare: columns[10] || '',
          email: columns[11] || '',
          comuneDomicilio: columns[12] || '',
          provDomicilio: columns[13] || '',
          indirizzo: columns[14] || '',
          cap: columns[15] || ''
        });
      }
    });
    
    return participants;
  };

  const handleParseParticipants = () => {
    const parsed = parseParticipants(participantsText);
    updateData({ participants: parsed });
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
              N. | COGNOME | NOME | Genere | Data nascita | Comune nascita | Prov nascita | 
              Cittadinanza | Codice Fiscale | Titolo di studio | Cellulare | Mail | 
              Comune domicilio | Prov domicilio | Via e n. civico | CAP
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
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ Partecipanti Caricati: {data.participants.length}
              </h3>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">Cognome</th>
                      <th className="text-left p-1">Nome</th>
                      <th className="text-left p-1">CF</th>
                      <th className="text-left p-1">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.participants.slice(0, 5).map((participant, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-1">{participant.cognome}</td>
                        <td className="p-1">{participant.nome}</td>
                        <td className="p-1 font-mono text-xs">{participant.codiceFiscale}</td>
                        <td className="p-1 text-xs">{participant.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.participants.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ... e altri {data.participants.length - 5} partecipanti
                  </p>
                )}
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
