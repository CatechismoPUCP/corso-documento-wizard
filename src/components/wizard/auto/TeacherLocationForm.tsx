
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeacherLocationFormProps {
  teacherCF: string;
  setTeacherCF: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  organization: string;
  setOrganization: (value: string) => void;
}

const TeacherLocationForm = ({ 
  teacherCF, 
  setTeacherCF, 
  location, 
  setLocation, 
  organization, 
  setOrganization 
}: TeacherLocationFormProps) => {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="teacherCF">Codice Fiscale Docente *</Label>
          <Input
            id="teacherCF"
            value={teacherCF}
            onChange={(e) => setTeacherCF(e.target.value.toUpperCase())}
            placeholder="RSSMRA80A01H501Z"
            maxLength={16}
            required
          />
        </div>
        <div>
          <Label htmlFor="location">Sede del Corso *</Label>
          <Select value={location} onValueChange={setLocation} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona sede" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Porta Venezia">Porta Venezia</SelectItem>
              <SelectItem value="Porta Romana">Porta Romana</SelectItem>
              <SelectItem value="Stazione Centrale">Stazione Centrale</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="organization">Ente/Organizzazione</Label>
        <Input
          id="organization"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="AKG-grup srl"
        />
      </div>
    </>
  );
};

export default TeacherLocationForm;
