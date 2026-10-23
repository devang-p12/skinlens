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
      case 'flagged for biopsy':
        return <Badge variant="urgent">Biopsy Ordered</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Clinical Registry
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Screening Cases</h1>
          <p className="text-sm text-slate-500">
            Dermatological case repository, risk stratification, and clinician review tracking.
          </p>
        </div>

        <Button
          onClick={onNewScreening}
          variant="primary"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20"
        >
          New Screening
        </Button>
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
            {['All', 'Awaiting Review', 'Under Review', 'Reviewed'].map((st) => (
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
            <div className="py-16 text-center text-slate-500 space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <p className="text-base font-semibold text-slate-800">No cases found</p>
                <p className="text-xs text-slate-400">
                  Try adjusting search parameters or start a new patient screening.
                </p>
              </div>
              <Button
                onClick={onNewScreening}
                variant="outline"
                size="sm"
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Create Screening
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5">Patient / Case ID</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">AI Classification</th>
                    <th className="px-4 py-3.5">Certainty</th>
                    <th className="px-4 py-3.5">Risk Tier</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Reviewer</th>
                    <th className="px-5 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((c) => (
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
                          {c.triage_priority} Triage
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

                      <td className="px-4 py-4">{getRiskBadge(c.malignancy_risk)}</td>

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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
