import React, { useEffect, useState } from 'react';
import {
  Activity,
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  ShieldAlert,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ScreeningCase, DashboardStats } from '../types';
import { SkinLensApi } from '../services/api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardHeader, CardBody } from '../components/Card';

interface DashboardPageProps {
  onNewScreening: () => void;
  onViewCase: (caseId: string) => void;
  onViewAllCases: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNewScreening,
  onViewCase,
  onViewAllCases,
}) => {
  const [stats, setStats] = useState<DashboardStats>({
    screenings_today: 0,
    cases_awaiting_review: 0,
    review_recommended: 0,
    high_risk_detected: 0,
    total_screenings: 0,
  });
  const [recentCases, setRecentCases] = useState<ScreeningCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const loadDashboardData = async () => {
      try {
        const [statsData, casesData] = await Promise.all([
          SkinLensApi.getStats(),
          SkinLensApi.getCases(),
        ]);
        if (mounted) {
          setStats(statsData);
          setRecentCases(casesData.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return <Badge variant="urgent" dot>High Risk</Badge>;
      case 'moderate':
        return <Badge variant="moderate" dot>Moderate Risk</Badge>;
      case 'low':
        return <Badge variant="routine" dot>Low Risk</Badge>;
      default:
        return <Badge variant="neutral">{risk}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'awaiting review':
        return <Badge variant="warning">Awaiting Review</Badge>;
      case 'under review':
        return <Badge variant="info">Under Review</Badge>;
      case 'reviewed':
        return <Badge variant="success">Reviewed</Badge>;
      case 'flagged for biopsy':
        return <Badge variant="urgent">Biopsy Ordered</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-7 sm:p-8 shadow-xl border border-teal-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Clinical Explainable AI Screening • MVP Ideathon Edition
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              SkinLens Diagnostic Triage
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Assisting clinical decision-making with instant optical quality validation,
              dermatological lesion classification, calibrated risk triage, and layer-4 Grad-CAM explainability maps.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button
              onClick={onNewScreening}
              size="lg"
              variant="primary"
              leftIcon={<PlusCircle className="w-5 h-5" />}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-lg shadow-teal-500/25 border-0"
            >
              New Screening
            </Button>
            <Button
              onClick={onViewAllCases}
              size="lg"
              variant="outline"
              className="bg-white/10 hover:bg-white/15 text-white border-white/20 backdrop-blur-sm"
            >
              Browse Cases
            </Button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Cards Grid - Required: Screenings Today, Cases Awaiting Review, Review Recommended */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Screenings Today */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Screenings Today
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {loading ? '—' : stats.screenings_today}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18% vs prior day</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Cases Awaiting Review */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cases Awaiting Review
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
              {loading ? '—' : stats.cases_awaiting_review}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Avg queue time: 24 min</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Review Recommended */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Review Recommended
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {loading ? '—' : stats.review_recommended}
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Urgent & moderate triage</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* High Risk Detected */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              High Risk Detected
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">
              {loading ? '—' : stats.high_risk_detected}
            </h3>
            <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Melanoma & SCC priority</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Core Flow Stepper Card */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800">
        <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">
          Core MVP Screening Pipeline
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          {[
            { step: '1', title: 'Upload Image', desc: 'Dermoscopy or clinical photo' },
            { step: '2', title: 'Quality Check', desc: 'Blur, lighting & contrast' },
            { step: '3', title: 'AI Classification', desc: 'Differential diagnosis' },
            { step: '4', title: 'Confidence Meter', desc: 'Calibrated certainty %' },
            { step: '5', title: 'Grad-CAM XAI', desc: 'Visual saliency heatmap' },
            { step: '6', title: 'Clinician Review', desc: 'Diagnosis & referral triage' },
          ].map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[10px] flex items-center justify-center border border-teal-500/30">
                  {item.step}
                </span>
                {i < 5 && <ArrowRight className="w-3 h-3 text-slate-600 hidden md:block" />}
              </div>
              <div>
                <p className="font-semibold text-slate-200">{item.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Cases Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Cases</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest patient screenings awaiting or completed clinician review
            </p>
          </div>
          <Button
            onClick={onViewAllCases}
            variant="ghost"
            size="sm"
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            View All Cases
          </Button>
        </CardHeader>

        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Case ID / Patient</th>
                  <th className="px-4 py-3.5">Lesion Location</th>
                  <th className="px-4 py-3.5">AI Primary Diagnosis</th>
                  <th className="px-4 py-3.5">Confidence</th>
                  <th className="px-4 py-3.5">Risk Level</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCases.map((c) => (
                  <tr
                    key={c.case_id}
                    onClick={() => onViewCase(c.case_id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{c.patient_name}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {c.case_id} • Age {c.patient_age}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-700">
                      {c.lesion_location}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-slate-900 block text-xs sm:text-sm">
                        {c.primary_diagnosis}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {c.triage_priority} Triage
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">
                          {(c.confidence * 100).toFixed(1)}%
                        </span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              c.confidence >= 0.9
                                ? 'bg-teal-500'
                                : c.confidence >= 0.8
                                ? 'bg-sky-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${c.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{getRiskBadge(c.malignancy_risk)}</td>
                    <td className="px-4 py-4">{getStatusBadge(c.status)}</td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCase(c.case_id);
                        }}
                      >
                        Inspect Case
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
