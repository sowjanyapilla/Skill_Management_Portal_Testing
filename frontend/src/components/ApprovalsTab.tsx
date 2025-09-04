
import React, { useState, useEffect, useRef } from "react";
import { Check,Pencil, X, MessageSquare, Star } from "lucide-react";
import { User } from "../types";

interface ApprovalsTabProps {
  user: User;
}

type Tab = "pending" | "approved" | "rejected";

type Mode = "idle" | "editing" | "rejecting";

interface ApprovalAction {
  mode?: Mode;
  proficiency?: number | null;
  comments?: string | null;
}

interface NormalizedSubmission {
  id: string | number;
  employee: { id: number; name: string; email?: string };
  skill_name: string;
  sub_skill_name: string;
  experience_years?: number | null;
  employee_proficiency?: number | null; // what employee submitted
  manager_proficiency?: number | null; // last manager rating (history)
  manager_comments?: string | null;
  has_certification?: boolean;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  status: string;
}

export default function ApprovalsTab({ user }: ApprovalsTabProps) {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [approvals, setApprovals] = useState<Record<Tab, NormalizedSubmission[]>>({
    pending: [],
    approved: [],
    rejected: [],
  });
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const [actions, setActions] = useState<Record<string | number, ApprovalAction>>({});
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    employee_name: "",
    skill_name: "",
    sub_skill_name: "",
    has_certification: "all",
    min_experience: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const debounceTimer = useRef<number | null>(null);

  const normalizeRecord = (r: any, source: "pending" | "history"): NormalizedSubmission => {
    if (source === "pending") {
      return {
        id: r.id,
        employee: r.employee,
        skill_name: r.skill_name,
        sub_skill_name: r.sub_skill_name,
        experience_years: r.experience,
        employee_proficiency: r.proficiency,
        manager_proficiency: null,
        manager_comments: null,
        has_certification: !!r.certification,
        created_at: r.created_at,
        updated_at: r.updated_at ?? null,
        status: r.status,
      };
    }
    return {
      id: r.id,
      employee: r.employee,
      skill_name: r.skill_name,
      sub_skill_name: r.sub_skill_name,
      experience_years: r.experience,
      employee_proficiency: r.proficiency,
      manager_proficiency: r.manager_proficiency,
      manager_comments: r.manager_comments,
      has_certification: !!r.certification,
      created_at: r.created_at,
      updated_at: r.updated_at,
      status: r.status,
    };
  };

  const fetchApprovals = async (status: Tab, page = 1) => {
    if (!user.is_approver) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        manager_id: String(user.id),
        page: String(page),
        limit: String(pagination.limit),
      });

      if (filters.employee_name) params.append("employee_name", filters.employee_name);
      if (filters.skill_name) params.append("skill_name", filters.skill_name);
      if (filters.sub_skill_name) params.append("sub_skill_name", filters.sub_skill_name);
      if (filters.has_certification !== "all") {
        params.append(
          "has_certification",
          filters.has_certification === "certified" ? "true" : "false"
        );
      }
      if (filters.min_experience) params.append("min_experience", filters.min_experience);

      let url = "";
      let source: "pending" | "history" = "pending";

      if (status === "pending") {
        url = `${BACKEND_URL}/approvals/pending?${params.toString()}`;
        source = "pending";
      } else {
        const statusEnum = status === "approved" ? "APPROVED" : "REJECTED";
        params.append("status", statusEnum);
        url = `${BACKEND_URL}/approvals/history?${params.toString()}`;
        source = "history";
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();

      const records = (data.records || []).map((r: any) => normalizeRecord(r, source));

      setApprovals((prev) => ({ ...prev, [status]: records }));
      setPagination((prev) => ({ ...prev, total: data.total ?? 0, page: data.page ?? page }));
    } catch (err) {
      console.error("Error fetching approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user.is_approver) return;

    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      fetchApprovals(activeTab, 1);
    }, 600);

    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters]);

  const toggleRowExpansion = (submissionId: string | number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(submissionId)) newSet.delete(submissionId);
    else newSet.add(submissionId);
    setExpandedRows(newSet);
  };

  const updateAction = (submissionId: string | number, updates: Partial<ApprovalAction>) => {
    setActions((prev) => ({ ...prev, [submissionId]: { ...(prev[submissionId] ?? {}), ...updates } }));
  };

  // Unified handler
  const handleAction = async (submission: NormalizedSubmission, mode: Mode) => {
    const actionState = actions[submission.id] ?? {};

    if (mode === "rejecting") {
      const comments = actionState.comments ?? "";
      if (!comments || !comments.trim()) {
        alert("Comments are required to reject a submission.");
        return;
      }
    }

    let body: any = {};
    if (mode === "editing") {
      body = {
        action: "approve",
        proficiency: actionState.proficiency ?? undefined,
        comments: actionState.comments ?? undefined,
      };
    }

    if (mode === "rejecting") {
      body = { action: "reject", comments: actionState.comments };
    }

    try {
      const res = await fetch(`${BACKEND_URL}/approvals/${submission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        console.error("Approval failed:", err ?? res.statusText);
        alert("Failed to update. See console for details.");
        return;
      }

      // clear actions for the row
      setActions((prev) => {
        const copy = { ...prev };
        delete copy[submission.id];
        return copy;
      });

      // close expansion and refresh
      setExpandedRows((prev) => {
        const copy = new Set(prev);
        copy.delete(submission.id);
        return copy;
      });
      fetchApprovals(activeTab, pagination.page);
    } catch (err) {
      console.error("Error approving/rejecting submission:", err);
      alert("Error communicating with server.");
    }
  };

  // small helper to render stars with optional editing
  const renderStars = (proficiency: number | null | undefined, onChange?: (value: number) => void) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={`focus:outline-none ${onChange ? "cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              star <= (proficiency ?? 0)
                ? "text-yellow-400 fill-current"
                : onChange
                ? "text-gray-300 hover:text-yellow-200"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (!user.is_approver) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">Manager access required</p>
          <p className="text-sm">Only managers can view skill approvals.</p>
        </div>
      </div>
    );
  }

  const currentApprovals = approvals[activeTab];
  const clearFilters = () => {
    setFilters({
      employee_name: "",
      skill_name: "",
      sub_skill_name: "",
      has_certification: "all",
      min_experience: "",
    });
  };
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {(["pending", "approved", "rejected"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4  bg-gray-50 rounded-t-lg items-end">
        <input
          type="text"
          placeholder="Employee Name"
          value={filters.employee_name}
          onChange={(e) => setFilters({ ...filters, employee_name: e.target.value })}
          className="px-2 py-1 border rounded-md text-sm"
        />
        <input
          type="text"
          placeholder="Skill Name"
          value={filters.skill_name}
          onChange={(e) => setFilters({ ...filters, skill_name: e.target.value })}
          className="px-2 py-1 border rounded-md text-sm"
        />
        <input
          type="text"
          placeholder="Sub Skill Name"
          value={filters.sub_skill_name}
          onChange={(e) => setFilters({ ...filters, sub_skill_name: e.target.value })}
          className="px-2 py-1 border rounded-md text-sm"
        />
        <input
          type="number"
          placeholder="Min Experience"
          value={filters.min_experience}
          onChange={(e) => setFilters({ ...filters, min_experience: e.target.value })}
          className="px-2 py-1 border rounded-md text-sm"
        />
        <select
          value={filters.has_certification}
          onChange={(e) => setFilters({ ...filters, has_certification: e.target.value })}
          className="px-2 py-1 border rounded-md text-sm"
        >
          <option value="all">All Certifications</option>
          <option value="certified">Certified</option>
          <option value="not_certified">Not Certified</option>
        </select>
        <button
          onClick={clearFilters}
          className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-6 text-gray-500">Loading...</div>
      ) : currentApprovals.length === 0 ? (
        <div className="text-center py-12">
          <Check className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No {activeTab} approvals found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <colgroup>
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Skill</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Rating</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience (yrs)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certification</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>

                    {activeTab !== "pending" && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated On</th>
                    )}

                    {activeTab === "approved" && (
                      <>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated Ratings</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager Comments</th>
                      </>
                    )}

                    {activeTab === "rejected" && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager Comments</th>
                    )}

                    {activeTab === "pending" && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentApprovals.map((submission) => (
                    <React.Fragment key={submission.id}>
                      <tr>
                        <td className="px-3 py-2 text-sm max-w-[12rem]"><div className="truncate" title={submission.employee.name}>{submission.employee.name}</div></td>
                        <td className="px-3 py-2 text-sm max-w-[12rem]" ><div className="truncate" title={submission.skill_name}>{submission.skill_name}</div></td>
                        <td className="px-3 py-2 text-sm max-w-[12rem]"><div className="truncate" title={submission.sub_skill_name}>{submission.sub_skill_name}</div></td>
                        <td className="px-3 py-2 text-sm">{renderStars(submission.employee_proficiency ?? 0)}</td>
                        <td className="px-3 py-2 text-sm text-center">{submission.experience_years
  ? `${Math.floor(submission.experience_years / 12)}Y, ${submission.experience_years % 12}m`
  : "—"}</td>
                        <td className="px-3 py-2 text-sm text-center">{submission.has_certification ? "Yes" : "No"}</td>
                        <td className="px-3 py-2 text-sm"><div className="truncate" title={submission.created_at ? new Date(submission.created_at).toLocaleDateString() : '—'}>{submission.created_at ? new Date(submission.created_at).toLocaleDateString() : '—'}</div></td>

                        {activeTab !== "pending" && (
                          <td className="px-3 py-2 text-sm"><div className="truncate" title={submission.updated_at ? new Date(submission.updated_at).toLocaleDateString() : '—'}>{submission.updated_at ? new Date(submission.updated_at).toLocaleDateString() : '—'}</div></td>
                        )}

                        {activeTab === "approved" && (
                          <>
                            <td className="px-3 py-2 text-sm">{submission.manager_proficiency != null ? renderStars(submission.manager_proficiency) : "—"}</td>
                            <td className="px-3 py-2 text-sm max-w-[36rem]"><div className="truncate" title={submission.manager_comments ?? '—'}>{submission.manager_comments ?? '—'}</div></td>
                          </>
                        )}

                        {activeTab === "rejected" && (
                          <td className="px-3 py-2 text-sm max-w-[36rem]"><div className="truncate" title={submission.manager_comments ?? '—'}>{submission.manager_comments ?? '—'}</div></td>
                        )}

                        {activeTab === "pending" && (
                          <td className="px-3 py-2 text-sm flex items-center justify-center space-x-2">
                            <button
                              onClick={() => {
                                (async () => {
                                  try {
                                    const res = await fetch(`${BACKEND_URL}/approvals/${submission.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ action: "approve" }),
                                    });
                                    if (!res.ok) throw new Error("Approve failed");
                                    fetchApprovals(activeTab, pagination.page);
                                  } catch (err) {
                                    console.error(err);
                                    alert("Approve failed. See console for details.");
                                  }
                                })();
                              }}
                              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
                            >
                              <Check size={16} />
                            </button>

                            <button
                              onClick={() => {
                                updateAction(submission.id, { mode: "editing", proficiency: submission.manager_proficiency ?? submission.employee_proficiency ?? null, comments: submission.manager_comments ?? null });
                                toggleRowExpansion(submission.id);
                              }}
                              className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() => {
                                updateAction(submission.id, { mode: "rejecting", comments: "" });
                                toggleRowExpansion(submission.id);
                              }}
                              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        )}
                      </tr>

                      {expandedRows.has(submission.id) && (
                        <tr>
                          <td colSpan={10} className="px-6 py-4 bg-gray-50">
                            {/* Show different content for editing vs rejecting */}
                            {actions[submission.id]?.mode === "editing" ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium">Updated Ratings</label>
                                  {renderStars(actions[submission.id]?.proficiency ?? submission.manager_proficiency ?? submission.employee_proficiency ?? 0, (val) => updateAction(submission.id, { proficiency: val }))}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Manager's comment</label>
                                  <textarea
                                    value={actions[submission.id]?.comments ?? ""}
                                    onChange={(e) => updateAction(submission.id, { comments: e.target.value })}
                                    className="w-full p-2 border rounded-md text-sm"
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleAction(submission, "editing")}
                                    className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200"
                                  >
                                    Save Changes
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActions((prev) => ({ ...prev, [submission.id]: { mode: "idle" } }));
                                      setExpandedRows((prev) => {
                                        const copy = new Set(prev);
                                        copy.delete(submission.id);
                                        return copy;
                                      });
                                    }}
                                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium">Manager Comments (required to reject)</label>
                                  <textarea
                                    value={actions[submission.id]?.comments ?? ""}
                                    onChange={(e) => updateAction(submission.id, { comments: e.target.value })}
                                    className="w-full p-2 border rounded-md text-sm"
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleAction(submission, "rejecting")}
                                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                                  >
                                    Confirm Reject
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActions((prev) => ({ ...prev, [submission.id]: { mode: "idle" } }));
                                      setExpandedRows((prev) => {
                                        const copy = new Set(prev);
                                        copy.delete(submission.id);
                                        return copy;
                                      });
                                    }}
                                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center space-x-2 mt-4">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchApprovals(activeTab, pagination.page - 1)}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>

            <span>Page {pagination.page} of {totalPages}</span>

            <button
              disabled={pagination.page >= totalPages}
              onClick={() => fetchApprovals(activeTab, pagination.page + 1)}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
