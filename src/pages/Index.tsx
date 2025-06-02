
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, Calendar, FileText, Download } from "lucide-react";
import CourseWizard from '@/components/CourseWizard';

const Index = () => {
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return <CourseWizard onBack={() => setShowWizard(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Generatore Documenti Corso
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sistema wizard per la creazione automatica di documenti di corso di formazione.
              Inserisci i dati del corso e genera automaticamente report Word e calendari Excel.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <CardTitle className="text-sm">Gestione Calendario</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Parsing automatico del calendario delle lezioni</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <CardTitle className="text-sm">Lista Partecipanti</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Parsing tabella partecipanti con validazione</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                <CardTitle className="text-sm">Report Word</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Generazione automatica documenti Word</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Download className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                <CardTitle className="text-sm">Export Excel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Calendario orario dettagliato in Excel</p>
              </CardContent>
            </Card>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <Button 
              onClick={() => setShowWizard(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
            >
              Inizia Nuovo Corso
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
