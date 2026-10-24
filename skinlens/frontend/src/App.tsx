import React, { useState, useEffect, useRef } from 'react';
import { PageView, ScreeningCase, ScreeningApiResponse } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewScreeningPage } from './pages/NewScreeningPage';
import { ScreeningResultPage } from './pages/ScreeningResultPage';
import { CasesPage } from './pages/CasesPage';
import { CaseDetailsPage } from './pages/CaseDetailsPage';
import { Activity } from 'lucide-react';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('landing');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CASE-2026-8901');
  const [activeScreeningResult, setActiveScreeningResult] = useState<ScreeningCase | null>(null);
  const [activeApiResponse, setActiveApiResponse] = useState<ScreeningApiResponse | undefined>();
  const [pageVisible, setPageVisible] = useState(true);
  const prevPage = useRef<PageView>('landing');

  const handleNavigate = (page: PageView) => {
    if (page === currentPage) return;
    // Trigger fade-out → update → fade-in
    setPageVisible(false);
    setTimeout(() => {
      prevPage.current = currentPage;
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'instant' });
      setPageVisible(true);
    }, 160);
  };

  const handleNewScreening = () => handleNavigate('new-screening');

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
      {/* Top Clinical Navbar — hidden on landing */}
      {currentPage !== 'landing' && (
        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onNewScreening={handleNewScreening}
        />
      )}

      {/* Landing page has its own full-width navbar strip */}
      {currentPage === 'landing' && (
        <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-700 to-emerald-500 flex items-center justify-center text-white shadow-sm">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-white font-extrabold tracking-tight">SkinLens</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                MVP
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavigate('dashboard')}
                className="text-slate-400 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/8 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavigate('cases')}
                className="text-slate-400 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/8 transition-colors"
              >
                Cases
              </button>
              <button
                onClick={handleNewScreening}
                className="flex items-center gap-1.5 text-sm font-bold px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors shadow-sm"
              >
                New Screening
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Container */}
      <main className={`flex-1 ${currentPage !== 'landing' ? 'max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8' : 'max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6'}`}>
        <div
          className="transition-all duration-150 ease-in-out"
          style={{
            opacity: pageVisible ? 1 : 0,
            transform: pageVisible ? 'translateY(0)' : 'translateY(6px)',
          }}
        >
          {currentPage === 'landing' && (
            <LandingPage
              onGetStarted={handleNewScreening}
              onLoadDemo={() => handleNavigate('cases')}
            />
          )}

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
        </div>
      </main>

      {/* Footer — hidden on landing */}
      {currentPage !== 'landing' && (
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
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono text-[10px] uppercase">
                Research / Ideathon Prototype
              </span>
              <span className="hidden sm:inline">•</span>
              <span>Grad-CAM Interpretability Engine</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-amber-800 font-semibold">Not intended for clinical diagnosis.</span>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            "SkinLens is an AI-assisted screening prototype and does not replace professional medical assessment or provide a definitive diagnosis."
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;

