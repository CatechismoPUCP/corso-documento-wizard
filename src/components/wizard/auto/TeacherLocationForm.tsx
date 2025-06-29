
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
  linkZoom: string;
  setLinkZoom: (value: string) => void;
  idRiunione: string;
  setIdRiunione: (value: string) => void;
  passcode: string;
  setPasscode: (value: string) => void;
}

const TeacherLocationForm = ({
  teacherCF, setTeacherCF,
  location, setLocation,
  organization, setOrganization,
  linkZoom, setLinkZoom,
  idRiunione, setIdRiunione,
  passcode, setPasscode
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

      <div className="space-y-2 pt-4 border-t">
        <h3 className="font-medium">Dati per Formazione a Distanza (FAD)</h3>
        <div>
          <Label htmlFor="linkZoom">Link Zoom</Label>
          <Input
            id="linkZoom"
            value={linkZoom}
            onChange={(e) => setLinkZoom(e.target.value)}
            placeholder="https://us06web.zoom.us/j/..."
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="idRiunione">ID Riunione Zoom</Label>
            <Input
              id="idRiunione"
              value={idRiunione}
              onChange={(e) => setIdRiunione(e.target.value)}
              placeholder="834 4346 0156"
            />
          </div>
          <div>
            <Label htmlFor="passcode">Passcode Zoom</Label>
            <Input
              id="passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="083375"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherLocationForm;
