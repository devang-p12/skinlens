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
  FileCheck2,
  Share2,
  Edit3,
  BadgeAlert,
  Send,
} from 'lucide-react';
import { ScreeningCase } from '../types';
import { SkinLensApi } from '../services/api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardHeader, CardBody } from '../components/Card';
import { GradCAMViewer } from '../components/GradCAMViewer';
import { QualityIndicator } from '../components/QualityIndicator';
import { ABCDECard } from '../components/ABCDECard';

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

  // Review form state
  const [reviewerName, setReviewerName] = useState<string>('Dr. Julian Vance, MD, FAAD');
  const [reviewerRole, setReviewerRole] = useState<string>('Attending Dermatologist');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [triageVerdict, setTriageVerdict] = useState<string>('Agreed with AI Diagnosis');
  const [finalRiskLevel, setFinalRiskLevel] = useState<string>('High');
  const [actionTaken, setActionTaken] = useState<string>('Urgent diagnostic excisional biopsy');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const fetchCase = async () => {
      setLoading(true);
      try {
        const data = await SkinLensApi.getCaseById(caseId);
        if (mounted && data) {
          setCurrentCase(data);
          setFinalRiskLevel(data.malignancy_risk);
          if (data.clinician_review) {
            setReviewerName(data.clinician_review.reviewer_name);
            setReviewerRole(data.clinician_review.reviewer_role);
            setReviewNotes(data.clinician_review.review_notes);
            setTriageVerdict(data.clinician_review.triage_verdict);
            setFinalRiskLevel(data.clinician_review.final_risk_level);
            setActionTaken(data.clinician_review.action_taken);
          } else {
            // Pre-fill smart clinical recommendation defaults based on AI output
            if (data.malignancy_risk === 'High') {
              setTriageVerdict('Agreed with AI Diagnosis');
              setActionTaken('Urgent full-thickness excisional biopsy within 48h');
              setReviewNotes(
                'Clinical examination corroborates neural Grad-CAM focus on notched asymmetric perimeter and atypical reticular globules. Patient advised on expedited excision.'
              );
            } else if (data.malignancy_risk === 'Moderate') {
              setTriageVerdict('Agreed with AI Diagnosis');
              setActionTaken('Surgical consultation / Mohs assessment');
              setReviewNotes(
                'Lesion exhibits classic translucent pearly border and arborizing telangiectasia consistent with basal cell carcinoma.'
              );
            } else {
              setTriageVerdict('Discharged (Benign)');
              setActionTaken('Patient reassurance, routine annual check');
              setReviewNotes(
                'Uniform symmetric melanocytic architecture. Reassured patient with standard skin cancer prevention guidelines.'
              );
            }
          }
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCase) return;

    setIsSubmitting(true);
    try {
      const updated = await SkinLensApi.submitReview(currentCase.case_id, {
        reviewer_name: reviewerName,
        reviewer_role: reviewerRole,
        review_notes: reviewNotes,
        triage_verdict: triageVerdict,
        final_risk_level: finalRiskLevel,
        action_taken: actionTaken,
      });
      setCurrentCase(updated);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading clinical case profile...</p>
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Breadcrumb & Actions */}
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
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">
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
                {currentCase.malignancy_risk} Risk
              </Badge>
              <Badge
                variant={isReviewed ? 'success' : 'warning'}
              >
                {currentCase.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              Case Profile: {currentCase.patient_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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

      {reviewSuccess && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-sm flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          <div>
            <span className="font-bold">Clinician Review Logged Successfully!</span>
            <p className="text-xs text-teal-700 mt-0.5">
              Case status updated to 'Reviewed' and verified in patient history.
            </p>
          </div>
        </div>
      )}

      {/* Patient Demographic & Clinical Context Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Patient Demographics</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              {currentCase.patient_name} ({currentCase.patient_age} yo)
            </span>
            <span className="text-slate-500 font-mono">Patient ID: {currentCase.patient_id}</span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block">Lesion Location & Duration</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
              {currentCase.lesion_location}
            </span>
            <span className="text-slate-500">Duration: {currentCase.duration}</span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block">Intake Clinical Notes</span>
            <p className="text-slate-700 text-xs mt-0.5 line-clamp-2">
              {currentCase.clinical_notes || 'No specific clinical notes provided at intake.'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-medium block">Reported Symptoms</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {currentCase.symptoms && currentCase.symptoms.length > 0 ? (
                currentCase.symptoms.map((sym, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]"
                  >
                    {sym}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">None logged</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Inference Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                AI Diagnostic Summary
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {(currentCase.confidence * 100).toFixed(1)}% Certainty
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
              {currentCase.primary_diagnosis}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {currentCase.triage_reason}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Screening Priority:</span>
            <Badge
              variant={
                currentCase.triage_priority === 'Urgent'
                  ? 'urgent'
                  : currentCase.triage_priority === 'Moderate'
                  ? 'moderate'
                  : 'routine'
              }
            >
              {currentCase.triage_priority} Triage
            </Badge>
          </div>
        </div>

        <div className="md:col-span-5">
          <QualityIndicator quality={currentCase.quality} />
        </div>
      </div>

      {/* Grad-CAM Interpretability Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Grad-CAM Visual Heatmap Interpretation
            </h3>
            <p className="text-xs text-slate-500">
              Inspect neural activation layer-4 attention map over lesion topography
            </p>
          </div>
        </div>

        <GradCAMViewer
          gradcam={currentCase.gradcam}
          primaryDiagnosis={currentCase.primary_diagnosis}
          confidence={currentCase.confidence}
        />
      </div>

      {/* Clinician Review & Attestation Panel (The Final Step of the Core MVP Flow) */}
      <div className="bg-white rounded-xl border-2 border-teal-500/30 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Clinician Review & Diagnostic Attestation
              </h3>
              <p className="text-xs text-slate-500">
                Core MVP Step 6: Dermatologist evaluation, agreement/adjustment, and referral order
              </p>
            </div>
          </div>

          {currentCase.clinician_review && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Verified on {new Date(currentCase.clinician_review.reviewed_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleReviewSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reviewing Clinician Name
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Credential / Role
              </label>
              <input
                type="text"
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Triage Verdict
              </label>
              <select
                value={triageVerdict}
                onChange={(e) => setTriageVerdict(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="Agreed with AI Diagnosis">Agreed with AI Diagnosis</option>
                <option value="Adjusted Risk Level">Adjusted Risk Level</option>
                <option value="Flagged for Urgent Biopsy">Flagged for Urgent Biopsy</option>
                <option value="Second Opinion Requested">Second Opinion Requested</option>
                <option value="Discharged (Benign)">Discharged (Benign)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Final Stratified Risk
              </label>
              <div className="flex gap-2">
                {['High', 'Moderate', 'Low'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFinalRiskLevel(r)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      finalRiskLevel === r
                        ? r === 'High'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : r === 'Moderate'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recommended Action
              </label>
              <input
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                required
                placeholder="e.g. Full-thickness excisional biopsy"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinician Review Notes & Diagnostic Rationale
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              required
              placeholder="Document physical dermoscopy findings, corroboration of Grad-CAM heatmaps, or reasons for risk adjustment..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Submitting updates case status and final triage classification.
            </span>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<FileCheck2 className="w-4 h-4" />}
              className="bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20"
            >
              {isReviewed ? 'Update Clinician Review' : 'Save & Certify Review'}
            </Button>
          </div>
        </form>
      </div>

      {/* ABCDE Dermatological Criteria Breakdown */}
      <ABCDECard abcde={currentCase.abcde} />
    </div>
  );
};
