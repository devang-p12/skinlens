import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  FolderOpen,
  Eye,
  Calendar,
  User,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Camera,
  Trash2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ScreeningCase } from '../types';
import { SkinLensApi } from '../services/api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardHeader, CardBody } from '../components/Card';

interface CasesPageProps {
  onSelectCase: (caseId: string) => void;
  onNewScreening: () => void;
}

export const CasesPage: React.FC<CasesPageProps> = ({
  onSelectCase,
  onNewScreening,
}) => {
  const [cases, setCases] = useState<ScreeningCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await SkinLensApi.getCases({
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        risk_level: selectedRisk !== 'All' ? selectedRisk : undefined,
        search: searchQuery.trim() || undefined,
      });
      setCases(data);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [selectedStatus, selectedRisk]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  const handleDeleteCase = async (e: React.MouseEvent, caseId: string, patientName: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete screening case ${caseId} (${patientName})?`)) {
      return;
    }
    try {
      await SkinLensApi.deleteCase(caseId);
      setCases((prev) => prev.filter((c) => c.case_id !== caseId));
      setActionNotice(`Case ${caseId} deleted successfully.`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      console.error('Failed to delete case:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all screening cases? This removes pre-existing demo data and lets you start with a clean slate.')) {
      return;
    }
    try {
      await SkinLensApi.clearAllCases();
      setCases([]);
      setActionNotice('Registry cleared. All pre-existing cases removed.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Failed to clear cases:', err);
    }
  };

  const handleResetDemo = async () => {
    try {
      setLoading(true);
      const restored = await SkinLensApi.resetDemoCases();
      setCases(restored);
      setActionNotice('Pre-existing demo cases restored.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      console.error('Failed to reset demo cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return <Badge variant="urgent" dot>High Risk</Badge>;
      case 'moderate':
        return <Badge variant="moderate" dot>Moderate</Badge>;
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
      case 'awaiting specialist review':
        return <Badge variant="urgent">Awaiting Specialist Review</Badge>;
      case 'better image requested':
        return <Badge variant="warning">Retake Requested</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Clinical Registry
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({cases.length} {cases.length === 1 ? 'case' : 'cases'})
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Screening Cases</h1>
          <p className="text-sm text-slate-500">
            Dermatological case repository, risk stratification, and clinician review tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {cases.length > 0 && (
            <Button
              onClick={handleClearAll}
              variant="outline"
              size="md"
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              className="text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs"
              title="Remove pre-existing demo cases to start clean"
            >
              Clear Registry
            </Button>
          )}

          <Button
            onClick={handleResetDemo}
            variant="secondary"
            size="md"
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
            className="text-xs"
            title="Reset to default demo cases"
          >
            Reset Demo
          </Button>

          <Button
            onClick={onNewScreening}
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 text-xs sm:text-sm font-semibold"
          >
            New Screening
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, case ID, lesion location, or diagnosis..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
          {/* Status Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-medium mr-1">Status:</span>
            {[
              'All',
              'Awaiting Review',
              'Reviewed',
              'Awaiting Specialist Review',
              'Better Image Requested',
            ].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  selectedStatus === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Risk Level Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-medium mr-1">Risk:</span>
            {['All', 'High', 'Moderate', 'Low'].map((rk) => (
              <button
                key={rk}
                onClick={() => setSelectedRisk(rk)}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  selectedRisk === rk
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {rk === 'All' ? 'All Risks' : `${rk} Risk`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cases List Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Loading screening cases...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="py-16 px-6 text-center max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-teal-600 shadow-sm">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Clinical Registry is Empty</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  No patient screening records exist in the registry. You can start fresh by intaking a new patient, or restore the pre-existing demonstration cases.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <Button
                  onClick={onNewScreening}
                  variant="primary"
                  size="sm"
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                  className="bg-teal-600 hover:bg-teal-700 shadow-sm w-full sm:w-auto"
                >
                  Start New Patient Screening
                </Button>
                <Button
                  onClick={handleResetDemo}
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
                  className="w-full sm:w-auto text-xs"
                >
                  Load Demo Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Patient / Case ID</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">AI Prediction</th>
                    <th className="px-4 py-3.5">Confidence</th>
                    <th className="px-4 py-3.5">Screening Priority</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Reviewer</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((c) => {
                    const priority =
                      c.screening_priority ||
                      (c.malignancy_risk === 'High'
                        ? 'Review Recommended'
                        : 'Routine Follow-up');
                    return (
                      <tr
                        key={c.case_id}
                        onClick={() => onSelectCase(c.case_id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{c.patient_name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {c.case_id} • Age {c.patient_age}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-xs font-medium text-slate-700">
                          {c.lesion_location}
                        </td>

                        <td className="px-4 py-4">
                          <span className="font-semibold text-slate-900 block text-xs sm:text-sm">
                            {c.primary_diagnosis}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {c.condition_code}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {(c.confidence * 100).toFixed(1)}%
                            </span>
                            <div className="w-14 bg-slate-100 h-1.5 rounded-full overflow-hidden">
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

                        <td className="px-4 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                              priority === 'Prompt Professional Evaluation'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : priority === 'Review Recommended'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {priority}
                          </span>
                        </td>

                        <td className="px-4 py-4">{getStatusBadge(c.status)}</td>

                        <td className="px-4 py-4 text-xs text-slate-600">
                          {c.clinician_review ? (
                            <div>
                              <span className="font-medium text-slate-900 block">
                                {c.clinician_review.reviewer_name.split(',')[0]}
                              </span>
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                ✓ Verified
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Pending review</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              rightIcon={<ChevronRight className="w-4 h-4 text-slate-400" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCase(c.case_id);
                              }}
                            >
                              View
                            </Button>
                            <button
                              type="button"
                              title={`Delete case ${c.case_id}`}
                              onClick={(e) => handleDeleteCase(e, c.case_id, c.patient_name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
