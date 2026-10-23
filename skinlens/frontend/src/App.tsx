import React, { useState } from 'react';
import { PageView, ScreeningCase, ScreeningApiResponse } from './types';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { NewScreeningPage } from './pages/NewScreeningPage';
import { ScreeningResultPage } from './pages/ScreeningResultPage';
import { CasesPage } from './pages/CasesPage';
import { CaseDetailsPage } from './pages/CaseDetailsPage';
import { Activity, ShieldCheck, HeartPulse, Sparkles } from 'lucide-react';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CASE-2026-8901');
  const [activeScreeningResult, setActiveScreeningResult] = useState<ScreeningCase | null>(null);
  const [activeApiResponse, setActiveApiResponse] = useState<ScreeningApiResponse | undefined>();

  const handleNavigate = (page: PageView) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewScreening = () => {
    handleNavigate('new-screening');
  };

  const handleScreeningComplete = (
    newCase: ScreeningCase,
    apiResp?: ScreeningApiResponse
  ) => {
    setActiveScreeningResult(newCase);
    setActiveApiResponse(apiResp);
    setSelectedCaseId(newCase.case_id);
    handleNavigate('result');
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    handleNavigate('case-details');
  };

  const handleProceedToReview = (caseId: string) => {
    setSelectedCaseId(caseId);
    handleNavigate('case-details');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Clinical Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onNewScreening={handleNewScreening}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentPage === 'dashboard' && (
          <DashboardPage
            onNewScreening={handleNewScreening}
            onViewCase={handleSelectCase}
            onViewAllCases={() => handleNavigate('cases')}
          />
        )}

        {currentPage === 'new-screening' && (
          <NewScreeningPage
            onScreeningComplete={handleScreeningComplete}
            onCancel={() => handleNavigate('dashboard')}
          />
        )}

        {currentPage === 'result' && activeScreeningResult && (
          <ScreeningResultPage
            screeningCase={activeScreeningResult}
            apiResponse={activeApiResponse}
            onProceedToReview={handleProceedToReview}
            onBackToDashboard={() => handleNavigate('dashboard')}
            onViewAllCases={() => handleNavigate('cases')}
            onNewScreening={handleNewScreening}
          />
        )}

        {currentPage === 'cases' && (
          <CasesPage
            onSelectCase={handleSelectCase}
            onNewScreening={handleNewScreening}
          />
        )}

        {currentPage === 'case-details' && (
          <CaseDetailsPage
            caseId={selectedCaseId}
            onBack={() => handleNavigate('cases')}
            onNewScreening={handleNewScreening}
          />
        )}
      </main>

      {/* Professional Clinical Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white/80 backdrop-blur-sm text-xs text-slate-500 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">SkinLens</span>
            <span>— Explainable AI-Powered Skin Lesion Screening Platform</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-slate-400 text-center sm:text-right">
            <span>Decision-Support Prototype</span>
            <span className="hidden sm:inline">•</span>
            <span>Grad-CAM Interpretability Engine</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-slate-500 font-medium">Not a Diagnostic System</span>
          </div>
        </div>

        {/* Global Clinical Disclaimer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
          "SkinLens is an AI-assisted screening prototype and does not replace professional medical assessment or provide a definitive diagnosis."
        </div>
      </footer>
    </div>
  );
}

export default App;
