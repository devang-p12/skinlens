import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  User,
  Calendar,
  Clock,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Stethoscope,
  ArrowRight,
  Sparkles,
  FileText,
  PlusCircle,
} from 'lucide-react';
import { ScreeningCase, ClinicianReview, SpecialistReferral } from '../types';
import { SkinLensApi } from '../services/api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { QualityIndicator } from '../components/QualityIndicator';
import { ABCDECard } from '../components/ABCDECard';
import { PrototypeScreeningPriority } from '../components/PrototypeScreeningPriority';
import { CaseTimeline } from '../components/CaseTimeline';
import { ClinicianReviewPanel } from '../components/ClinicianReviewPanel';
import { GradCAMViewer } from '../components/GradCAMViewer';
import { WorkflowIndicator } from '../components/WorkflowIndicator';
import { CaseSummaryModal } from '../components/CaseSummaryModal';

interface CaseDetailsPageProps {
  caseId: string;
  onBack: () => void;
  onNewScreening: () => void;
}

export const CaseDetailsPage: React.FC<CaseDetailsPageProps> = ({
  caseId,
  onBack,
  onNewScreening,
}) => {
  const [currentCase, setCurrentCase] = useState<ScreeningCase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const fetchCase = async () => {
      setLoading(true);
      try {
        const data = await SkinLensApi.getCaseById(caseId);
        if (mounted && data) {
          setCurrentCase(data);
        }
      } catch (err) {
        console.error('Failed to load case:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCase();
    return () => {
      mounted = false;
    };
  }, [caseId]);

  // Handle Mark as Reviewed
  const handleReviewSubmit = async (review: ClinicianReview) => {
    if (!currentCase) return;
    try {
      const updated = await SkinLensApi.markAsReviewed(currentCase.case_id, review);
      setCurrentCase(updated);
      setActionNotice('Review recorded successfully. Case status updated to "Reviewed".');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.error('Failed to mark reviewed:', err);
    }
  };

  // Handle Refer for Specialist Review
  const handleReferralCreate = async (referral: SpecialistReferral) => {
    if (!currentCase) return;
    try {
      const updated = await SkinLensApi.referCase(currentCase.case_id, referral);
      setCurrentCase(updated);
      setActionNotice('Specialist referral created. Status: Awaiting Specialist Review.');
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err) {
      console.error('Failed to create referral:', err);
    }
  };

  // Handle Request Better Image
  const handleRequestBetterImage = async (reason: string) => {
    if (!currentCase) return;
    try {
      const updated = await SkinLensApi.requestImageRetake(currentCase.case_id, reason);
      setCurrentCase(updated);
      setActionNotice('Image retake requested. Status: Better Image Requested.');
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err) {
      console.error('Failed to request retake:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading clinical decision-support profile...</p>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-lg font-bold text-slate-800">Case Not Found</p>
        <Button onClick={onBack} variant="outline" size="sm">
          Return to Cases
        </Button>
      </div>
    );
  }

  const isReviewed = currentCase.status === 'Reviewed';
  const isReferred = currentCase.status === 'Awaiting Specialist Review';
  const isRetake = currentCase.status === 'Better Image Requested';

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-24">
      {/* 5-Step Workflow Stepper Indicator */}
      <WorkflowIndicator
        currentStep="action"
        completedSteps={['capture', 'validate', 'analyze', 'explain']}
      />

      {/* Top Header & Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Cases
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                {currentCase.case_id}
              </span>
              <Badge
                variant={
                  currentCase.malignancy_risk === 'High'
                    ? 'urgent'
                    : currentCase.malignancy_risk === 'Moderate'
                    ? 'moderate'
                    : 'routine'
                }
                dot
              >
                {currentCase.malignancy_risk} Risk Signal
              </Badge>
              <Badge
                variant={
                  isReferred
                    ? 'urgent'
                    : isReviewed
                    ? 'success'
                    : isRetake
                    ? 'warning'
                    : 'warning'
                }
              >
                {currentCase.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Case Profile: {currentCase.patient_name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setIsSummaryModalOpen(true)}
            variant="outline"
            size="sm"
            leftIcon={<FileText className="w-4 h-4 text-teal-600" />}
            className="border-teal-300 text-teal-800 hover:bg-teal-50 font-semibold"
          >
            Case Summary
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Clinical Slip
          </Button>
          <Button
            onClick={onNewScreening}
            variant="primary"
            size="sm"
            className="bg-teal-600 hover:bg-teal-700"
          >
            New Screening
          </Button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-sm flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          <p className="font-semibold">{actionNotice}</p>
        </div>
      )}

      {/* SECTION 1: PROTOTYPE SCREENING PRIORITY */}
      <PrototypeScreeningPriority
        prediction={currentCase.primary_diagnosis}
        confidence={currentCase.confidence}
        priority={currentCase.screening_priority}
      />

      {/* SECTION 2: EXPLAINABLE AI GRAD-CAM VISUAL HIGHLIGHT */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Explainable AI: Real Grad-CAM Visualization
            </h3>
            <p className="text-xs text-slate-500">
              Visual proof from the convolutional feature layer verifying what pixels guided the model
            </p>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            Interactive Visual Highlight
          </span>
        </div>

        <GradCAMViewer
          gradcam={currentCase.gradcam}
          primaryDiagnosis={currentCase.primary_diagnosis}
          confidence={currentCase.confidence}
        />
      </div>

      {/* SECTION 3: CLINICIAN REVIEW PANEL */}
      <ClinicianReviewPanel
        screeningCase={currentCase}
        onReviewSubmit={handleReviewSubmit}
        onReferralCreate={handleReferralCreate}
        onRequestBetterImage={handleRequestBetterImage}
        onViewSummary={() => setIsSummaryModalOpen(true)}
      />

      {/* SECTION 4: 7-STEP CASE TIMELINE & DEMOGRAPHICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <CaseTimeline
            screeningCase={currentCase}
            referral={currentCase.referral}
          />
        </div>

        {/* Patient Demographic & Optical Quality (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Patient Demographic Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Patient Demographic Details
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Patient Name & Age</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {currentCase.patient_name} ({currentCase.patient_age} years old)
                </span>
                <span className="text-slate-500 font-mono">ID: {currentCase.patient_id}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Lesion Location</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {currentCase.lesion_location}
                </span>
                <span className="text-slate-500">History: {currentCase.duration}</span>
              </div>

              {currentCase.clinical_notes && (
                <div>
                  <span className="text-slate-400 block font-medium">Intake Notes</span>
                  <p className="text-slate-700 italic mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    "{currentCase.clinical_notes}"
                  </p>
                </div>
              )}

              {currentCase.symptoms && currentCase.symptoms.length > 0 && (
                <div>
                  <span className="text-slate-400 block font-medium mb-1">Observed Symptoms</span>
                  <div className="flex flex-wrap gap-1">
                    {currentCase.symptoms.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optical Quality Card */}
          <QualityIndicator quality={currentCase.quality} />
        </div>
      </div>

      {/* ABCDE Dermatological Criteria Breakdown */}
      <ABCDECard abcde={currentCase.abcde} />

      {/* Case Summary Modal */}
      <CaseSummaryModal
        screeningCase={currentCase}
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
      />
    </div>
  );
};
