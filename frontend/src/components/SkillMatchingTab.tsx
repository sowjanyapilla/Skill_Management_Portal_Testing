import  { useState, useEffect} from 'react';
import { Search, Filter, Star, Award } from 'lucide-react';
import { User, SkillFilter, SkillSubmission } from '../types';

interface SkillMatchingTabProps {
  user: User;
}

export default function SkillMatchingTab({ user }: SkillMatchingTabProps) {
const [filters, setFilters] = useState<SkillFilter>({});
  const [filteredSkills, setFilteredSkills] = useState<SkillSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  // In your frontend file: SkillMatchingTab.tsx

const fetchSkills = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Error: No authentication token found in localStorage. Please log in first.");
      return;
    }

    const params = new URLSearchParams();
    if (filters.skill && filters.skill.trim() !== '') {
      const skillsArray = filters.skill.split(',').map(s => s.trim()).filter(Boolean);
      params.append('skill', skillsArray.join(','));
    }
    if (filters.proficiency !== undefined) {
      params.append('proficiency', String(filters.proficiency));
    }
    if (filters.experience !== undefined) {
      params.append('experience', String(filters.experience));
    }
    if (filters.hasCertification !== undefined) {
      params.append('has_certification', String(filters.hasCertification));
    }

    params.append("page", String(page));
    params.append("page_size", "10");

    const url = `${import.meta.env.VITE_BACKEND_URL}/skills/matching?${params.toString()}`;
    console.log("Sending GET request to:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Backend Error:", errorData);
      throw new Error(`Failed to fetch skills: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // ✅ Backend should return { total, results }
    const mappedData = data.results.map((skill: any) => ({
      ...skill,
      sub_skills: skill.sub_skills.map((sub: any) => ({
        name: sub.sub_skill_name,
        proficiency: sub.manager_proficiency,
        experience: sub.experience_years,
        hasCertification: sub.has_certification,
        certificationFile: undefined,
        employeeName: sub.employee_name,
        employeeId: sub.employee_id
      })),
    }));

    setFilteredSkills(mappedData);
    setTotalPages(data.total_pages);

  } catch (error) {
    console.error("Error fetching skills:", error);
  } finally {
    setLoading(false);
  }
};

const handleExport = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const params = new URLSearchParams();
    if (filters.skill) params.append("skill", filters.skill);
    if (filters.proficiency !== undefined) params.append("proficiency", String(filters.proficiency));
    if (filters.experience !== undefined) params.append("experience", String(filters.experience));
    if (filters.hasCertification !== undefined) params.append("has_certification", String(filters.hasCertification));

    const url = `${import.meta.env.VITE_BACKEND_URL}/skills/matching/export?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to export Excel");

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "skills_export.xlsx";
    link.click();
  } catch (err) {
    console.error(err);
    alert("Error exporting skills to Excel");
  }
};


useEffect(() => {
  fetchSkills();
}, [page]);

const handleClearFilters = () => {
  setFilters({});
  setFilteredSkills([]);   // 🔑 clear data
  setPage(1);              // optional: reset pagination
};


  const renderStars = (proficiency: number) => {
    return (
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < proficiency ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="">
  <div className="flex justify-between items-center -mt-2">  {/* negative margin moves it up */}
    <h2 className="text-lg font-bold text-gray-900">
      Filters
    </h2>
  </div>


      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        
        
  <div className="flex flex-wrap items-end gap-4">
    {/* Skill/Sub-skill */}
    <div className="flex-1 min-w-[150px]">
      <label className="block text-sm font-medium text-gray-700 mb-1">Skill/Sub-skill</label>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
        <input
          type="text"
          value={filters.skill || ''}
          onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
          placeholder="Search skills..."
          className="w-full pl-8 pr-2 py-1 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>
    </div>

    {/* Minimum Proficiency */}
    <div className="w-32">
      <label className="block text-sm font-medium text-gray-700 mb-1">Min Proficiency</label>
      <select
        value={filters.proficiency || ''}
        onChange={(e) => setFilters({ ...filters, proficiency: e.target.value ? parseInt(e.target.value) : undefined })}
        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
      >
        <option value="">All</option>
        <option value="1">1★+</option>
        <option value="2">2★+</option>
        <option value="3">3★+</option>
        <option value="4">4★+</option>
        <option value="5">5★</option>
      </select>
    </div>

    {/* Minimum Experience */}
    <div className="w-32">
      <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience</label>
      <input
        type="number"
        step="0.1"
        min="0"
        value={filters.experience || ''}
        onChange={(e) => setFilters({ ...filters, experience: e.target.value ? parseFloat(e.target.value) : undefined })}
        placeholder="0"
        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
    </div>

    {/* Certifications */}
    <div className="w-32">
      <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
      <select
        value={filters.hasCertification === undefined ? '' : filters.hasCertification.toString()}
        onChange={(e) => setFilters({ ...filters, hasCertification: e.target.value === '' ? undefined : e.target.value === 'true' })}
        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
      >
        <option value="">All</option>
        <option value="true">With Cert</option>
        <option value="false">Without Cert</option>
      </select>
    </div>

    {/* Buttons */}
    <div className="flex gap-2 mt-1">
      <button
        onClick={fetchSkills}
        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
      >
        Search
      </button>
      <button
        onClick={() => { setFilters({}); setFilteredSkills([]); setPage(1); }}
        className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
      >
        Clear
      </button>
      <button
        onClick={handleExport}
        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
      >
        Export
      </button>
    </div>
</div>
      </div>

      {/* Filtered Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Matching Skills ({filteredSkills.length} found)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
  <table className="min-w-full table-fixed divide-y divide-gray-200 text-sm">
    <thead className="bg-gray-100">
      <tr>
        <th className="px-4 py-2 text-left font-semibold text-gray-700 w-40">
          Employee Name
        </th>
        <th className="px-4 py-2 text-left font-semibold text-gray-700 w-32">
          Employee Id
        </th>
        <th className="px-4 py-2 text-left font-semibold text-gray-700 w-40">
          Skill
        </th>
        <th className="px-4 py-2 text-left font-semibold text-gray-700 w-40">
          Sub-skill
        </th>
        <th className="px-4 py-2 text-left font-semibold text-gray-700 w-32">
          Manager Approved Proficiency
        </th>
        <th className="px-4 py-2 text-left font-semibold text-gray-700 w-24">
          Experience
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {filteredSkills.map((skill) =>
        skill.sub_skills.map((subSkill, subIndex) => (
          <tr key={`${skill.id}-${subIndex}`} className="hover:bg-gray-50 align-top">
            <td className="px-5 py-2 text-xs text-gray-600">{subSkill.employeeName}</td>
            <td className="px-5 py-2 text-xs text-gray-600">{subSkill.employeeId}</td>
            <td className="px-5 py-2 text-xs text-gray-800 font-medium">
              <div className="flex items-center space-x-1">
                <Award className="w-4 h-4 text-blue-500" />
                <span>{skill.skill_name}</span>
              </div>
            </td>
            <td className="px-5 py-2 text-xs text-gray-600">{subSkill.name}</td>
            <td className="px-4 py-2 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                {renderStars(subSkill.proficiency)}
                <span>({subSkill.proficiency}/5)</span>
              </div>
            </td>
            <td className="px-4 py-2 text-xs text-gray-600">{subSkill.experience} years</td>
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
    onClick={() => setPage((p) => Math.max(1, p - 1))}
    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
  >
    Previous
  </button>
  <span className="text-sm text-gray-600">
    Page {page} of {totalPages}
  </span>
  <button
    disabled={page === totalPages}
    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
  >
    Next
  </button>
</div>


      </div>
    </div>
  );
}