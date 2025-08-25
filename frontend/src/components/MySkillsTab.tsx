import { useEffect, useState } from "react";
import { Award, FileText, Star } from "lucide-react";
import { Skill } from "../types";
import AddSkillCard from "./AddSkillCard";

interface SubSkillResponseFromBackend {
  id: number;
  skill_id: number;
  sub_skill_name: string;
  proficiency_level: number;
  manager_proficiency?: number;
  experience_years: number;
  has_certification: boolean;
  certification_file_url?: string;
  status?: "pending" | "approved" | "rejected";
  manager_comments?: string;
  created_at: string;
}

interface SkillResponseFromBackend {
  id: number;
  user_id: number;
  skill_name: string;
  status?: "pending" | "approved" | "rejected";
  manager_comments?: string;
  created_at: string;
  sub_skills: SubSkillResponseFromBackend[];
}

export default function MySkillsTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const pageSize =5;
  const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const url = new URL(`${BASE_URL}/skills/my-skills`);
        url.searchParams.append("skip", ((page - 1) * pageSize).toString());
        url.searchParams.append("limit", pageSize.toString());
        if (statusFilter) {
      // 🔽 Convert to lowercase before sending
      url.searchParams.append("status", statusFilter.toLowerCase());
    }

        const res = await fetch(url.toString(), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const resData = await res.json();
        setTotal(resData.total);
        const mappedSkills: Skill[] = resData.skills.map(
          (skillResp: SkillResponseFromBackend) => ({
            id: skillResp.id,
            user_id: skillResp.user_id,
            skill_name: skillResp.skill_name,
            created_at: skillResp.created_at,
            status: skillResp.status,
            manager_comments: skillResp.manager_comments,
            sub_skills: skillResp.sub_skills.map((sub) => ({
              id: sub.id,
              skill_id: sub.skill_id,
              sub_skill_name: sub.sub_skill_name,
              proficiency_level: sub.proficiency_level,
              manager_proficiency: sub.manager_proficiency,
              status: (sub.status ?? "pending").toLowerCase(),
              manager_comments: sub.manager_comments,
              experience_years: sub.experience_years,
              has_certification: sub.has_certification,
              certification_file_url: sub.certification_file_url,
              created_at: sub.created_at,
            })),
          })
        );
        setSkills(mappedSkills);
      } catch (err) {
        console.error(err);
        setError("Failed to load skills");
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [BASE_URL, page, refreshKey, statusFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const handleSkillSubmit = () => {
    setSuccessMessage("Skill has been submitted successfully!");
    setShowAddSkill(false);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] || ""
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderStars = (proficiency: number) => (
    <div className="flex space-x-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < proficiency ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  if (loading) return <p>Loading skills...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="space-y-6 font-sans">
      {/* Header with Filter + Add Skill */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 tracking-tight">
          My Skills
        </h2>
        <div className="flex items-center space-x-3">
          <select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  className="px-3 py-1.5 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
>
  <option value="">All</option>
  <option value="PENDING">Pending</option>
  <option value="APPROVED">Approved</option>
  <option value="REJECTED">Rejected</option>
</select>

          {!showAddSkill && (
            <button
              onClick={() => setShowAddSkill(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Skill
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <p className="text-green-600 font-medium">{successMessage}</p>
      )}

      {showAddSkill ? (
        <AddSkillCard
          onSubmit={handleSkillSubmit}
          onCancel={() => setShowAddSkill(false)}
        />
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-40">
                    Skill Name
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-40">
                    Sub-skill
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-32">
                    Employee Proficiency
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-32">
                    Manager Approved Proficiency
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-32">
                    Experience (years)
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-60">
                    Manager Comments
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-32">
                    Certification
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-28">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {skills.map((skill) =>
                  skill.sub_skills.map((sub, idx) => (
                    <tr key={sub.id} className="align-top hover:bg-gray-50">
                      {idx === 0 && (
  <td
    rowSpan={skill.sub_skills.length}
    className={`px-4 py-3 font-medium text-gray-800 text-sm border-r border-gray-200 ${
      // Alternate background only for Skill Name column
      skills.indexOf(skill) % 2 === 0 ? "bg-gray-50" : "bg-white"
    }`}
  >
    <div className="flex items-center space-x-2">
      <Award className="w-4 h-4 text-blue-500" />
      <span>{skill.skill_name}</span>
    </div>
  </td>
)}
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {sub.sub_skill_name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          {renderStars(sub.proficiency_level)}
                          <span className="text-xs text-gray-500">
                            ({sub.proficiency_level}/5)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          {renderStars(sub.manager_proficiency ?? 0)}
                          <span className="text-xs text-gray-500">
                            ({sub.manager_proficiency ?? 0}/5)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {sub.experience_years} years
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 break-words max-w-[240px]">
                        {sub.manager_comments ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {sub.has_certification ? (
                          <div className="flex items-center text-green-600 text-xs">
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            <span>Certified</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(sub.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center px-5 py-3 border-t border-gray-200 bg-gray-50">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
