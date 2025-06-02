
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, MessageCircle, UserPlus, Users } from "lucide-react";
import { Participant } from '@/types/course';

interface StudentsContactTableProps {
  participants: Participant[];
  courseName: string;
}

const StudentsContactTable = ({ participants, courseName }: StudentsContactTableProps) => {
  // Helper function to normalize phone number to international format
  const normalizePhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // If starts with 39, it's already international (Italy)
    if (cleanPhone.startsWith('39')) {
      return cleanPhone;
    }
    
    // If starts with 0, remove it and add 39 (Italy country code)
    if (cleanPhone.startsWith('0')) {
      return '39' + cleanPhone.substring(1);
    }
    
    // If starts with 3 (typical Italian mobile), add 39
    if (cleanPhone.startsWith('3') && cleanPhone.length === 10) {
      return '39' + cleanPhone;
    }
    
    // Default: assume it's Italian and add 39
    return '39' + cleanPhone;
  };

  // Create WhatsApp link
  const createWhatsAppLink = (phone: string, name: string): string => {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) return '#';
    
    const message = encodeURIComponent(`Ciao ${name}, ti scrivo riguardo al corso "${courseName}"`);
    return `https://wa.me/${normalizedPhone}?text=${message}`;
  };

  // Create multiple email link
  const createMultipleEmailLink = (): string => {
    const validEmails = participants
      .filter(p => p.email && p.email.includes('@'))
      .map(p => p.email)
      .join(',');
    
    const subject = encodeURIComponent(`Corso: ${courseName}`);
    const body = encodeURIComponent(`Gentili corsisti,\n\nVi scrivo riguardo al corso "${courseName}".\n\nCordiali saluti`);
    
    return `mailto:${validEmails}?subject=${subject}&body=${body}`;
  };

  // Create vCard for contact
  const createVCard = (participant: Participant): string => {
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${participant.nome} ${participant.cognome}`,
      `N:${participant.cognome};${participant.nome};;;`,
      participant.email ? `EMAIL:${participant.email}` : '',
      participant.cellulare ? `TEL;TYPE=CELL:${participant.cellulare}` : '',
      `NOTE:Corso: ${courseName}`,
      'END:VCARD'
    ].filter(line => line).join('\n');
    
    return vCard;
  };

  // Download vCard
  const downloadContact = (participant: Participant) => {
    const vCard = createVCard(participant);
    const blob = new Blob([vCard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${participant.nome}_${participant.cognome}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const validEmailCount = participants.filter(p => p.email && p.email.includes('@')).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Contatti Rapidi Studenti
          </div>
          <Button
            onClick={() => window.open(createMultipleEmailLink(), '_blank')}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={validEmailCount === 0}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email a Tutti ({validEmailCount})
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nessun partecipante disponibile</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cellulare</TableHead>
                  <TableHead>Benefits</TableHead>
                  <TableHead className="text-center">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant, index) => (
                  <TableRow key={participant.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{participant.nome}</TableCell>
                    <TableCell className="font-medium">{participant.cognome}</TableCell>
                    <TableCell className="text-sm">
                      {participant.email ? (
                        <a 
                          href={`mailto:${participant.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {participant.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {participant.cellulare || <span className="text-gray-400">N/A</span>}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        participant.benefits === 'SI' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.benefits}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        {/* WhatsApp Button */}
                        {participant.cellulare && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(createWhatsAppLink(participant.cellulare, participant.nome), '_blank')}
                            className="p-2 h-8 w-8 bg-green-50 hover:bg-green-100 border-green-200"
                            title="Invia messaggio WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 text-green-600" />
                          </Button>
                        )}
                        
                        {/* Email Button */}
                        {participant.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`mailto:${participant.email}`, '_blank')}
                            className="p-2 h-8 w-8 bg-blue-50 hover:bg-blue-100 border-blue-200"
                            title="Invia email"
                          >
                            <Mail className="w-3 h-3 text-blue-600" />
                          </Button>
                        )}
                        
                        {/* Add to Contacts Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadContact(participant)}
                          className="p-2 h-8 w-8 bg-purple-50 hover:bg-purple-100 border-purple-200"
                          title="Aggiungi ai contatti"
                        >
                          <UserPlus className="w-3 h-3 text-purple-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {participants.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p><strong>📱 WhatsApp:</strong> Clicca l'icona verde per inviare un messaggio diretto</p>
            <p><strong>📧 Email:</strong> Clicca l'icona blu per inviare un'email individuale</p>
            <p><strong>👤 Contatti:</strong> Clicca l'icona viola per scaricare il contatto (.vcf)</p>
            <p><strong>📨 Email Multipla:</strong> Usa il pulsante in alto per scrivere a tutti insieme</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentsContactTable;
