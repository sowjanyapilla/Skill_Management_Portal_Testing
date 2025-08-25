
import React, { useState, useEffect, useRef } from "react";
import { Check, X, MessageSquare, Star } from "lucide-react";
import { User, SkillSubmission } from "../types";


interface ApprovalsTabProps {
  user: User;
}

type Tab = "pending" | "approved" | "rejected";

interface ApprovalAction {
  submissionId: string;
  action: "approve" | "reject";
  proficiency?: number;
  comments?: string;
}

export default function ApprovalsTab({ user }: ApprovalsTabProps) {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [approvals, setApprovals] = useState<Record<Tab, SkillSubmission[]>>({
    pending: [],
    approved: [],
    rejected: [],
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [actions, setActions] = useState<Record<string, ApprovalAction>>({});
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    employee_name: "",
    skill_name: "",
    sub_skill_name: "",
    has_certification: "all", // "all", "certified", "not_certified"
    min_experience: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchApprovals = async (status: Tab, page = 1) => {
    if (!user.is_manager) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        manager_id: String(user.id),
        status,
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

      const res = await fetch(`${BACKEND_URL}/approvals?${params.toString()}`);
      const data = await res.json();

      setApprovals((prev) => ({ ...prev, [status]: data.records }));
      setPagination((prev) => ({ ...prev, total: data.total, page: data.page }));
    } catch (err) {
      console.error("Error fetching approvals:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // useEffect(() => {
  //   fetchApprovals(activeTab, 1);
  // }, [activeTab, filters]);
  useEffect(() => {
    if (!user.is_manager) return;

    // Clear previous timer if user keeps typing
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // Set new timer to fetch after 600ms of inactivity
    debounceTimer.current = setTimeout(() => {
      fetchApprovals(activeTab, 1); // reset to first page
    }, 600);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [activeTab, filters]);

  const toggleRowExpansion = (submissionId: string) => {
    const newExpanded = new Set(expandedRows);
    newExpanded.has(submissionId)
      ? newExpanded.delete(submissionId)
      : newExpanded.add(submissionId);
    setExpandedRows(newExpanded);
  };

  const updateAction = (submissionId: string, updates: Partial<ApprovalAction>) => {
    setActions((prev) => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], ...updates },
    }));
  };

  const handleApproval = async (
    submissionId: string,
    action: "approve" | "reject"
  ) => {
    const actionData = actions[submissionId];
    try {
      const res = await fetch(`${BACKEND_URL}/approvals/${submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          proficiency: actionData?.proficiency,
          comments: actionData?.comments,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Approval failed:", errorData);
        return;
      }
      setActions((prev) => {
        const newActions = { ...prev };
        delete newActions[submissionId];
        return newActions;
      });
      fetchApprovals(activeTab, pagination.page);
    } catch (err) {
      console.error("Error approving/rejecting submission:", err);
    }
  };

  const renderStars = (proficiency: number, onChange?: (value: number) => void) => (
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
              star <= proficiency
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

  if (!user.is_manager) {
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
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {["pending", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as Tab)}
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

      {/* Approvals Table */}
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Skill</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience (yrs)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
                    {activeTab === "approved" && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved On</th>}
                    {activeTab === "rejected" && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected On</th>}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{activeTab === "pending" ? "Actions" : "Review"}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentApprovals.map((submission) => (
                    <React.Fragment key={submission.id}>
                      <tr>
                        <td className="px-6 py-4">{submission.employee.name}</td>
                        <td className="px-6 py-4">{submission.skill.skill_name}</td>
                        <td className="px-6 py-4">{submission.sub_skill_name}</td>
                        <td className="px-6 py-4">{renderStars(submission.employee_proficiency || 0)}</td>
                        <td className="px-6 py-4">{submission.experience_years || "—"}</td>
                        <td className="px-6 py-4">{submission.has_certification ? "Yes" : "No"}</td>
                        <td className="px-6 py-4">{new Date(submission.created_at).toLocaleDateString()}</td>
                        {activeTab === "approved" && <td className="px-6 py-4">{submission.updated_at ? new Date(submission.updated_at).toLocaleDateString() : "—"}</td>}
                        {activeTab === "rejected" && <td className="px-6 py-4">{submission.updated_at ? new Date(submission.updated_at).toLocaleDateString() : "—"}</td>}
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              submission.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : submission.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleRowExpansion(submission.id)}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
                          >
                            {activeTab === "pending" ? "Review" : "View Review"}
                          </button>
                        </td>
                      </tr>

                      {expandedRows.has(submission.id) && (
                        <tr>
                          <td colSpan={11} className="px-6 py-4 bg-gray-50">
                            {activeTab === "pending" ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium">Proficiency as per Manager</label>
                                  {renderStars(
                                    actions[submission.id]?.proficiency || 0,
                                    (val) => updateAction(submission.id, { proficiency: val })
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium">Manager Comments</label>
                                  <textarea
                                    value={actions[submission.id]?.comments || ""}
                                    onChange={(e) =>
                                      updateAction(submission.id, { comments: e.target.value })
                                    }
                                    className="w-full p-2 border rounded-md text-sm"
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApproval(submission.id, "approve")}
                                    className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
                                  >
                                    <Check className="w-3 h-3 mr-1 inline" /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleApproval(submission.id, "reject")}
                                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                                  >
                                    <X className="w-3 h-3 mr-1 inline" /> Reject
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 text-sm">
                                <div>
                                  <strong>Proficiency as per Manager:</strong>{" "}
                                  {renderStars(submission.manager_proficiency || 0)}
                                </div>
                                <div>
                                  <strong>Comments:</strong> {submission.manager_comments || "—"}
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
