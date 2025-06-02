
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, Calendar, FileText, Download, Zap, Settings } from "lucide-react";
import CourseWizard from '@/components/CourseWizard';
import AutomaticWizard from '@/components/AutomaticWizard';

const Index = () => {
  const [showWizard, setShowWizard] = useState<'manual' | 'automatic' | null>(null);

  if (showWizard === 'manual') {
    return <CourseWizard onBack={() => setShowWizard(null)} />;
  }

  if (showWizard === 'automatic') {
    return <AutomaticWizard onBack={() => setShowWizard(null)} />;
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

          {/* Wizard Type Selection */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center">
                <Zap className="w-12 h-12 mx-auto text-green-500 mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-xl">Wizard Automatico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6 text-center">
                  Incolla semplicemente la tabella del corso e i partecipanti. Parsing automatico di tutti i dati necessari.
                </p>
                <Button 
                  onClick={() => setShowWizard('automatic')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Inizia Wizard Veloce
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center">
                <Settings className="w-12 h-12 mx-auto text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-xl">Wizard Manuale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6 text-center">
                  Inserimento guidato passo-passo con controllo completo su tutti i parametri del corso.
                </p>
                <Button 
                  onClick={() => setShowWizard('manual')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Inizia Wizard Completo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
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
        </div>
      </div>
    </div>
  );
};

export default Index;
