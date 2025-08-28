/**
 * Base wizard component that provides common wizard functionality and UI structure.
 * This component eliminates code duplication between CourseWizard and AutomaticWizard.
 */
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";

export interface WizardStep {
  /** Step number (1-based) */
  number: number;
  /** Display title for the step */
  title: string;
  /** Brief description of what happens in this step */
  description: string;
}

interface WizardBaseProps {
  /** Current active step number */
  currentStep: number;
  /** Array of wizard steps configuration */
  steps: WizardStep[];
  /** Main wizard title */
  title: string;
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Content to render for the current step */
  children: React.ReactNode;
  /** Optional color theme for the wizard */
  theme?: 'blue' | 'green';
}

/**
 * Reusable wizard base component that provides:
 * - Consistent header with back button and title
 * - Progress indicator with step visualization
 * - Step navigation display
 * - Responsive layout structure
 */
const WizardBase: React.FC<WizardBaseProps> = ({
  currentStep,
  steps,
  title,
  onBack,
  children,
  theme = 'blue'
}) => {
  const progressPercentage = Math.round((currentStep / steps.length) * 100);
  
  const getStepStyles = (step: WizardStep) => {
    const baseClasses = "text-center p-3 rounded-lg border";
    
    if (step.number === currentStep) {
      return theme === 'green' 
        ? `${baseClasses} bg-green-50 border-green-300 text-green-700`
        : `${baseClasses} bg-blue-50 border-blue-300 text-blue-700`;
    }
    
    if (step.number < currentStep) {
      return `${baseClasses} bg-green-50 border-green-300 text-green-700`;
    }
    
    return `${baseClasses} bg-gray-50 border-gray-200 text-gray-500`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="outline" onClick={onBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Torna alla Home
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {title}
            </h1>
          </div>

          {/* Progress Steps */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Passaggio {currentStep} di {steps.length}</CardTitle>
                <span className="text-sm text-gray-500">
                  {progressPercentage}% completato
                </span>
              </div>
              
              {/* Show progress bar only for blue theme (manual wizard) */}
              {theme === 'blue' && (
                <Progress value={progressPercentage} className="mb-4" />
              )}
              
              <div className={`grid grid-cols-${steps.length} gap-4`}>
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className={getStepStyles(step)}
                  >
                    <div className="font-semibold text-sm">{step.title}</div>
                    <div className="text-xs mt-1">{step.description}</div>
                  </div>
                ))}
              </div>
            </CardHeader>
          </Card>

          {/* Step Content */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default WizardBase;
