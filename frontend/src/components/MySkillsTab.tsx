
import { useEffect, useState } from "react";
import { Award, FileText, Star, Edit, Filter, X } from "lucide-react";
import { Skill } from "../types";
import AddSkillCard from "./AddSkillCard";
import UpdateSkillModal from "./UpdateSkillModal";
import { SubSkillUpdate } from "../types";

interface SubSkillResponseFromBackend {
  id: number;
  skill_id: number;
  skill_name?: string;
  sub_skill_name: string;
  proficiency_level: number;
  manager_proficiency?: number;
  experience_years: number;
  has_certification: boolean;
  certification_file_url?: string;
  status?: "pending" | "approved" | "rejected";
  manager_comments?: string;
  created_at: string;
  subskill_id?: number;
  history_id?: number;
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
  const [skillFilter, setSkillFilter] = useState("");
  const [subSkillFilter, setSubSkillFilter] = useState("");
  const [allUniqueSkills, setAllUniqueSkills] = useState<string[]>([]);
  const [allUniqueSubSkills, setAllUniqueSubSkills] = useState<string[]>([]);
  const [selectedSubSkill, setSelectedSubSkill] = useState<SubSkillUpdate | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  // Removed isModalFromAddCard state

  // Filter dropdown state
  const [showSkillFilter, setShowSkillFilter] = useState(false);
  const [showSubSkillFilter, setShowSubSkillFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const pageSize = 5;
  // Fallback for VITE_BACKEND_URL to prevent compilation errors
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const handleFilterSelection = (filterType: string, value: string) => {
    switch (filterType) {
      case 'skill':
        setSkillFilter(value);
        setSubSkillFilter("");
        setShowSkillFilter(false);
        break;
      case 'subskill':
        setSubSkillFilter(value);
        setShowSubSkillFilter(false);
        break;
      case 'status':
        setStatusFilter(value);
        setShowStatusFilter(false);
        break;
    }
  };

useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 4000); // Clears the message after 4 seconds

      // Cleanup function to clear the timer if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const fetchAllFilters = async () => {
      try {
        const token = localStorage.getItem("token");
        const skillsUrl = new URL(`${BASE_URL}/skills/master-skills`);
        const skillsRes = await fetch(skillsUrl.toString(), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const skillsData: { skill_name: string; id: number }[] = await skillsRes.json();
        const uniqueSkillsList = skillsData.map(s => s.skill_name);
        setAllUniqueSkills(uniqueSkillsList);

        const allSubSkills: string[] = [];
        for (const skill of skillsData) {
          const subSkillsUrl = new URL(`${BASE_URL}/skills/sub-skills/${skill.id}`);
          const subSkillsRes = await fetch(subSkillsUrl.toString(), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const subSkillsData: { subskill_name: string }[] = await subSkillsRes.json();
          allSubSkills.push(...subSkillsData.map(s => s.subskill_name));
        }
        setAllUniqueSubSkills([...new Set(allSubSkills)]);
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
      }
    };
    fetchAllFilters();
  }, [BASE_URL]);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const url = new URL(`${BASE_URL}/skills/my-skills`);
        url.searchParams.append("skip", ((page - 1) * pageSize).toString());
        url.searchParams.append("limit", pageSize.toString());
        if (statusFilter) {
          url.searchParams.append("status", statusFilter);
        }
        if (skillFilter) {
          url.searchParams.append("skill_name", skillFilter);
        }
        if (subSkillFilter) {
          url.searchParams.append("sub_skill_name", subSkillFilter);
        }

        const res = await fetch(url.toString(), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const resData: { skills: SkillResponseFromBackend[]; total: number } = await res.json();
        setTotal(resData.total);
        const mappedSkills: Skill[] = resData.skills.map(
          (skillResp: SkillResponseFromBackend) => ({
            id: skillResp.id,
            user_id: skillResp.user_id,
            skill_name: skillResp.skill_name,
            created_at: skillResp.created_at,
            status: skillResp.status ?? "pending",
            manager_comments: skillResp.manager_comments,
            sub_skills: skillResp.sub_skills.map((sub) => ({
              id: sub.subskill_id ?? sub.id,
              skill_id: sub.skill_id,
              sub_skill_name: sub.sub_skill_name,
              proficiency_level: sub.proficiency_level,
              manager_proficiency: sub.manager_proficiency,
              status: (sub.status ?? "pending").toLowerCase() as "pending" | "approved" | "rejected",
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
  }, [BASE_URL, page, refreshKey, statusFilter, skillFilter, subSkillFilter]);

  const totalPages = Math.ceil(total / pageSize);

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

  const handleUpdateClick = async (
    sub: SubSkillResponseFromBackend,
    employee_id: number,
    history_id?: number
  ) => {
    // Removed setIsModalFromAddCard(false);
    const token = localStorage.getItem("token");
    if (!token) return;

    let url: URL;

    if (history_id) {
      url = new URL(`${BASE_URL}/skills/history/${history_id}`);
    } else {
      url = new URL(`${BASE_URL}/skills/skills/get`);
      url.searchParams.append("employee_id", employee_id.toString());
      url.searchParams.append(
        "subskill_id",
        sub.subskill_id?.toString() ?? sub.id.toString()
      );
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch sub-skill details");

    const resData = await res.json();

    const fullData: SubSkillUpdate = {
      emp_skill_id: resData.emp_skill_id ?? undefined,
      history_id: resData.history_id ?? undefined,
      employee_id: resData.employee_id,
      subskill_id: resData.subskill_id,
      skill_name: sub.skill_name ?? "",
      sub_skill_name: sub.sub_skill_name,
      proficiency_level: resData.employee_proficiency ?? resData.proficiency,
      experience_years: resData.experience_years ?? resData.experience,
      has_certification: !!resData.certification,
      certification_file_url:
        resData.certification_file_url ?? resData.certification ?? null,
      certification_creation_date: resData.certification_creation_date,
      certification_expiration_date: resData.certification_expiration_date,
      status: (resData.status ?? resData.approval_status)?.toLowerCase() as
        | "pending"
        | "approved"
        | "rejected",
    };

    setSelectedSubSkill(fullData);
    setIsUpdateModalOpen(true);
  };

  // Removed handleUpdateFromAddCard
  
  // New function to handle modal closure
  const handleModalClose = () => {
      setSelectedSubSkill(null);
      setIsUpdateModalOpen(false);
      // Removed conditional setShowAddSkill(true) logic
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-semibold text-gray-800 tracking-tight">
          My Skills
        </h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="flex items-center space-x-1 px-3 py-1.5 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
            >
              <Filter className="w-4 h-4" />
              <span>Status: {statusFilter || "All"}</span>
            </button>
            {showStatusFilter && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">Filter by Status</span>
                  <button onClick={() => setShowStatusFilter(false)}>
                    <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                  </button>
                </div>
                <div className="space-y-1">
                  <button onClick={() => handleFilterSelection('status', '')} className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm">All Status</button>
                  <button onClick={() => handleFilterSelection('status', 'PENDING')} className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm">Pending</button>
                  <button onClick={() => handleFilterSelection('status', 'APPROVED')} className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm">Approved</button>
                  <button onClick={() => handleFilterSelection('status', 'REJECTED')} className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm">Rejected</button>
                </div>
              </div>
            )}
          </div>
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
          onSubmit={({ inserted, duplicates }) => {
            let msg = "";
            if (inserted?.length) msg += `✅ Successfully added: ${inserted.join(", ")}. `;
            if (duplicates?.length) msg += `⚠️ Already exist: ${duplicates.join(", ")}. Please update them in My Skills.`;

            setSuccessMessage(msg || "Skill has been submitted successfully!");
            setShowAddSkill(false);
            setRefreshKey((prev) => prev + 1);

            setTimeout(() => setSuccessMessage(""), 4000);
          }}
          onSubmitAndAddNew={({ inserted, duplicates }) => {
            let msg = "";
            if (inserted?.length) msg += `✅ Successfully added: ${inserted.join(", ")}. `;
            if (duplicates?.length) msg += `⚠️ Already exist: ${duplicates.join(", ")}. Please update them in My Skills.`;

            setSuccessMessage(msg || "Skill has been submitted successfully!");
            setRefreshKey((prev) => prev + 1);

            setTimeout(() => setSuccessMessage(""), 4000);
          }}
          onCancel={() => setShowAddSkill(false)}
        />
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-40">
                    <div className="flex items-center space-x-2">
                      <span>Skill Name</span>
                      <div className="relative">
                        <button onClick={() => setShowSkillFilter(!showSkillFilter)} className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <Filter className="w-4 h-4 text-gray-500" />
                        </button>
                        {showSkillFilter && (
                          <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 p-2 max-h-60 overflow-y-auto">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-700">Filter by Skill</span>
                              <button onClick={() => setShowSkillFilter(false)}>
                                <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                              </button>
                            </div>
                            <div className="space-y-1">
                              <button onClick={() => handleFilterSelection('skill', '')} className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm">All</button>
                              {allUniqueSkills.map((skill) => (
                                <button key={skill} onClick={() => handleFilterSelection('skill', skill)} className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm">
                                  {skill}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-40">
                    <div className="flex items-center space-x-2">
                      <span>Sub-skill</span>
                      <div className="relative">
                        <button onClick={() => setShowSubSkillFilter(!showSubSkillFilter)} className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <Filter className="w-4 h-4 text-gray-500" />
                        </button>
                        {showSubSkillFilter && (
                          <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 p-2 max-h-60 overflow-y-auto">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-700">Filter by Sub-skill</span>
                              <button onClick={() => setShowSubSkillFilter(false)}>
                                <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                              </button>
                            </div>
                            <div className="space-y-1">
                              <button onClick={() => handleFilterSelection('subskill', '')} className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm">All</button>
                              {allUniqueSubSkills
                                .filter(sub => {
                                  if (skillFilter) {
                                    const filteredSkills = skills.find(s => s.skill_name === skillFilter);
                                    return filteredSkills?.sub_skills.some(ss => ss.sub_skill_name === sub);
                                  }
                                  return true;
                                })
                                .map((sub) => (
                                  <button key={sub} onClick={() => handleFilterSelection('subskill', sub)} className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm">
                                    {sub}
                                  </button>
                                ))}
                            </div>
</div>
                        )}
                      </div>
                    </div>

                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-32">
                    Employee Proficiency
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
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 w-24">
                    Action
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
                      <td className="px-4 py-3 text-xs text-gray-600">
          
                       {sub.experience_years >= 132 ? (
                          <div>10+ years</div>
                        ) : (
                          <div>{Math.floor(sub.experience_years / 12)}y, {(sub.experience_years % 12)}m</div>
                        )}
                      
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
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleUpdateClick(sub, skill.user_id, sub.status === "rejected" ? sub.history_id : undefined)}
                          className="flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors shadow-sm"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Update
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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

      {selectedSubSkill && isUpdateModalOpen && (
        <UpdateSkillModal
          subSkill={selectedSubSkill}
          onClose={handleModalClose}
          onUpdate={async (updatedSubSkill) => {
            try {
              const token = localStorage.getItem("token");
              if (!token) return;

              const updateUrl = selectedSubSkill.history_id
                ? `${BASE_URL}/skills/history/update/${selectedSubSkill.history_id}`
                : `${BASE_URL}/skills/update/`;

              const res = await fetch(updateUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  emp_skill_id: updatedSubSkill.emp_skill_id ?? null,
                  employee_id: updatedSubSkill.employee_id,
                  subskill_id: updatedSubSkill.subskill_id,
                  proficiency_level: updatedSubSkill.proficiency_level,
                  experience_years: updatedSubSkill.experience_years,
                  has_certification: updatedSubSkill.has_certification,
                  certification_file_url: updatedSubSkill.certification_file_url ?? null,
                  certification_creation_date: updatedSubSkill.certification_creation_date ?? null,
                  certification_expiration_date: updatedSubSkill.certification_expiration_date ?? null,
                }),
              });

              if (!res.ok) throw new Error(`Failed to update. Status: ${res.status}`);

              const data = await res.json();
              console.log("✅ Update success:", data);
              setSuccessMessage("✅ Skill updated successfully!");
              

              setRefreshKey((prev) => prev + 1);
              handleModalClose();
            } catch (err) {
              console.error("❌ Update failed:", err);
            }
          }}
        />
      )}
    </div>
  );
}