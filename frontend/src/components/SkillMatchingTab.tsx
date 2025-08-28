import { useState, useEffect, useMemo } from 'react';
import { Search, Star, Award } from 'lucide-react';
import { User } from '../types';

interface SkillMatchingTabProps {
  user: User;
}

interface SubSkillData {
  name: string;
  proficiency: number;
  experience: number;
  hasCertification?: boolean;
  status?: string;
  certificationFile?: File | string | null;
  certificationCreationDate?: string | null;
  certificationExpirationDate?: string | null;
  employee_name?: string;
  employee_id?: string;
  skill_name?: string;
  coverage?: number;
}

interface SkillData {
  skill_name: string;
  matched_subskills: number;
  total_subskills: number;
  sub_skills: SubSkillData[];
}

interface EmployeeData {
  employee_id: string;
  employee_name: string;
  coverage: number;
  skills: SkillData[];
}

interface SkillFilter {
  skill?: string;
  proficiency?: number;
  min_experience?: number;
  max_experience?: number;
  hasCertification?: boolean;
  status?: string;
  sortExperience?: 'asc' | 'desc';
  sortProficiency?: 'asc' | 'desc';
  sortCoverage?: 'asc' | 'desc';
  employee_name?: string;
}

export default function SkillMatchingTab({ user }: SkillMatchingTabProps) {
  const [filters, setFilters] = useState<SkillFilter>({});
  const [appliedFilters, setAppliedFilters] = useState<SkillFilter>({}); // ✅ only applied when Search clicked

  const [mainFilteredData, setMainFilteredData] = useState<SubSkillData[]>([]);
const [tableFilteredData, setTableFilteredData] = useState<SubSkillData[]>([]);
const [statusFilter, setStatusFilter] = useState<string>("All");
const [certificationFilter, setCertificationFilter] = useState<string>("All");
  const [flattenedSubSkills, setFlattenedSubSkills] = useState<SubSkillData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(2); // show 2 employees per page
  const [totalPages, setTotalPages] = useState(1); // backend total pages
 // ✅ add this
  const [subskillPageSize] = useState(10);
  const [totalSubSkillPages, setTotalSubSkillPages] = useState(1);
  const [searchInput, setSearchInput] = useState(""); // for typing
  const [searchTerm, setSearchTerm] = useState("");   // for applied search
  const [selectedCertification, setSelectedCertification] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string>("");
  const [data, setData] = useState<any[]>([]);
  const [tableFilters, setTableFilters] = useState<SkillFilter>({});
  const [searchTrigger, setSearchTrigger] = useState(0);




  const fetchSkills = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    const params = new URLSearchParams();
    if (appliedFilters.skill) params.append("skill", appliedFilters.skill);
    if (appliedFilters.proficiency !== undefined) params.append("proficiency", String(appliedFilters.proficiency));
    if (appliedFilters.min_experience !== undefined) params.append("min_experience", String(appliedFilters.min_experience));
    if (appliedFilters.max_experience !== undefined) params.append("max_experience", String(appliedFilters.max_experience));
    if (appliedFilters.hasCertification !== undefined) params.append("has_certification", String(appliedFilters.hasCertification));

    params.append("page", String(page));
    params.append("page_size", String(pageSize));

    const url = `${import.meta.env.VITE_BACKEND_URL}/skills/matching?${params.toString()}`;
    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Failed to fetch skills");
    const data = await response.json();

    setMainFilteredData(data.results);
    setTotalPages(data.total_pages);

    // flatten
    const flatten = data.results.flatMap((emp: EmployeeData) =>
      emp.skills.flatMap(skill =>
        skill.sub_skills.map(sub => ({
          ...sub,
          employee_name: emp.employee_name,
          employee_id: emp.employee_id,
          skill_name: skill.skill_name,
          coverage: emp.coverage,
        }))
      )
    );
    setFlattenedSubSkills(flatten);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};



// update input as user types
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchInput(e.target.value);
};

// Search button applies filters
const handleSearch = () => {
  setAppliedFilters(filters);
  setPage(1); // reset to first page
  setSearchTrigger(prev => prev + 1); // Trigger the fetch
};



// 🔑 only depends on appliedFilters
// Use the searchTrigger state to force a fetch when the button is clicked.
useEffect(() => {
  fetchSkills();
}, [page, pageSize, appliedFilters, searchTrigger]);

  // Local sorting & table header filters
  const filteredSubSkills = useMemo(() => {
  let arr = [...flattenedSubSkills];

  if (tableFilters.employee_name) {
    arr = arr.filter(s => s.employee_name?.toLowerCase().includes(tableFilters.employee_name!.toLowerCase()));
  }
  if (tableFilters.skill) {
    arr = arr.filter(
      s =>
        s.skill_name?.toLowerCase().includes(tableFilters.skill!.toLowerCase()) ||
        s.name?.toLowerCase().includes(tableFilters.skill!.toLowerCase())
    );
  }
  if (tableFilters.hasCertification !== undefined) {
    arr = arr.filter(s => s.hasCertification === tableFilters.hasCertification);
  }
  if (tableFilters.status) {
    arr = arr.filter(s => s.status === tableFilters.status);
  }
  if (tableFilters.sortProficiency) {
    arr.sort((a, b) =>
      tableFilters.sortProficiency === 'asc' ? a.proficiency - b.proficiency : b.proficiency - a.proficiency
    );
  }
  if (tableFilters.sortExperience) {
    arr.sort((a, b) =>
      tableFilters.sortExperience === 'asc' ? (a.experience ?? 0) - (b.experience ?? 0) : (b.experience ?? 0) - (a.experience ?? 0)
    );
  }
  if (tableFilters.sortCoverage) {
    arr.sort((a, b) =>
      tableFilters.sortCoverage === 'asc' ? (a.coverage ?? 0) - (b.coverage ?? 0) : (b.coverage ?? 0) - (a.coverage ?? 0)
    );
  }

  return arr;
}, [flattenedSubSkills, tableFilters]);


const groupedByEmployee = useMemo(() => {
  const empMap: Record<string, EmployeeData> = {};
  filteredSubSkills.forEach(sub => {
    if (!empMap[sub.employee_id!]) {
      empMap[sub.employee_id!] = {
        employee_id: sub.employee_id!,
        employee_name: sub.employee_name!,
        coverage: sub.coverage ?? 0,
        skills: []
      };
    }

    let skillObj = empMap[sub.employee_id!].skills.find(
      s => s.skill_name === sub.skill_name
    );

    if (!skillObj) {
      skillObj = { 
        skill_name: sub.skill_name!, 
        matched_subskills: 0, 
        total_subskills: 0, 
        sub_skills: [] 
      };
      empMap[sub.employee_id!].skills.push(skillObj);
    }

    skillObj.sub_skills.push(sub);
    skillObj.total_subskills++;
    if (sub.proficiency > 0) skillObj.matched_subskills++;
  });

  return Object.values(empMap);
}, [filteredSubSkills]);

  const renderStars = (proficiency: number | null) => {
    const p = proficiency ?? 0;
    return (
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < p ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("page_size", String(pageSize));

      if (searchTerm) {
        params.append("search", searchTerm);
      }
      if (selectedExperience) {
        params.append("experience", String(selectedExperience));
      }
      if (selectedCertification) {
        params.append("certification", String(selectedCertification));
      }

      const res = await fetch(`/api/skills?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
    }
  };

  fetchData();
}, [page, pageSize, searchTerm, selectedExperience, selectedCertification]);
  return (
    <div>
      {/* Main Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
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
                className="w-full pl-8 pr-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Min Proficiency */}
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Proficiency</label>
            <select
              value={filters.proficiency || ''}
              onChange={(e) => setFilters({ ...filters, proficiency: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All</option>
              {[1, 2, 3, 4, 5].map(i => <option key={i} value={i}>{i}★+</option>)}
            </select>
          </div>

          {/* Min & Max Exp */}
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Exp</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={filters.min_experience ?? ''}
              onChange={(e) => setFilters({ ...filters, min_experience: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Exp</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={filters.max_experience ?? ''}
              onChange={(e) => setFilters({ ...filters, max_experience: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Certification */}
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
            <select
              value={filters.hasCertification === undefined ? '' : filters.hasCertification.toString()}
              onChange={(e) => setFilters({ ...filters, hasCertification: e.target.value === '' ? undefined : e.target.value === 'true' })}
              className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All</option>
              <option value="true">With Cert</option>
              <option value="false">Without Cert</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-1">
            <button
  onClick={handleSearch}
  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
>
  Search
</button>

            <button onClick={() => { setFilters({}); setFlattenedSubSkills([]); setMainFilteredData([]); setPage(1); }} className="px-3 py-1 bg-gray-200 rounded-lg text-sm">Clear</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="flex justify-between items-center text-lg font-medium text-gray-900">
            Matching Sub-skills ({filteredSubSkills.length} found)
           
            <button
    onClick={async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const params = new URLSearchParams();
        if (appliedFilters.skill) params.append("skill", appliedFilters.skill);
        if (appliedFilters.proficiency !== undefined) params.append("proficiency", String(appliedFilters.proficiency));
        if (appliedFilters.min_experience !== undefined) params.append("min_experience", String(appliedFilters.min_experience));
        if (appliedFilters.max_experience !== undefined) params.append("max_experience", String(appliedFilters.max_experience));
        if (appliedFilters.hasCertification !== undefined) params.append("has_certification", String(appliedFilters.hasCertification));

        const url = `${import.meta.env.VITE_BACKEND_URL}/skills/matching/export?${params.toString()}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to export");

        const blob = await response.blob();
        const urlObject = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = urlObject;
        link.download = "employee_skills.xlsx";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(urlObject);
      } catch (err) {
        console.error(err);
      }
    }}
    className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
  >
    Export to Excel
  </button>
   </h3>
        </div>
          
            {/* ✅ Export Button */}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
           <thead className="bg-gray-100">
  <tr>
    <th className="px-4 py-2 text-left font-semibold">Employee Name</th>
    <th className="px-4 py-2 text-left font-semibold">Employee Id</th>
    <th className="px-4 py-2 text-left font-semibold">Skill</th>
    <th className="px-4 py-2 text-left font-semibold">Sub-skill</th>
    <th className="px-4 py-2 text-left font-semibold">
      Proficiency
      <select
        className="mt-1 w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
        value={tableFilters.sortProficiency || ''}
        onChange={(e) =>
          setTableFilters({
            ...tableFilters,
            sortProficiency: e.target.value
              ? (e.target.value as 'asc' | 'desc')
              : undefined,
          })
        }
      >
        <option value="">None</option>
        <option value="asc">Asc</option>
        <option value="desc">Desc</option>
      </select>
    </th>
    <th className="px-4 py-2 text-left font-semibold">
      Experience
      <select
        className="mt-1 w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
        value={tableFilters.sortExperience || ''}
        onChange={(e) =>
          setTableFilters({
            ...tableFilters,
            sortExperience: e.target.value
              ? (e.target.value as 'asc' | 'desc')
              : undefined,
          })
        }
      >
        <option value="">None</option>
        <option value="asc">Asc</option>
        <option value="desc">Desc</option>
      </select>
    </th>
    <th className="px-4 py-2 text-left font-semibold">
      Certification
      <select
        className="mt-1 w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
        value={
          tableFilters.hasCertification === undefined
            ? ''
            : tableFilters.hasCertification.toString()
        }
        onChange={(e) =>
          setTableFilters({
            ...tableFilters,
            hasCertification:
              e.target.value === ''
                ? undefined
                : e.target.value === 'true',
          })
        }
      >
        <option value="">All</option>
        <option value="true">With Cert</option>
        <option value="false">Without Cert</option>
      </select>
    </th>
    <th className="px-4 py-2 text-left font-semibold">
      Status
      <select
        className="mt-1 w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
        value={tableFilters.status || ''}
        onChange={(e) =>
          setTableFilters({
            ...tableFilters,
            status: e.target.value || undefined,
          })
        }
      >
        <option value="">All</option>
        <option value="APPROVED">APPROVED</option>
        <option value="PENDING">PENDING</option>
      </select>
    </th>
    <th className="px-4 py-2 text-left font-semibold">
      Coverage
      <select
        className="mt-1 w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
        value={tableFilters.sortCoverage || ''}
        onChange={(e) =>
          setTableFilters({
            ...tableFilters,
            sortCoverage: e.target.value
              ? (e.target.value as 'asc' | 'desc')
              : undefined,
          })
        }
      >
        <option value="">None</option>
        <option value="asc">Asc</option>
        <option value="desc">Desc</option>
      </select>
    </th>
  </tr>
</thead>




            <tbody className="bg-white divide-y divide-gray-200 text-xs">
  {groupedByEmployee.map((emp) =>
    emp.skills.flatMap((skill, skillIndex) => {
      const subSkills = skill.sub_skills.length
        ? skill.sub_skills
        : [{ name: "-", proficiency: 0, experience: 0, hasCertification: false, status: "-" }];

      return subSkills.map((sub, idx) => (
        <tr key={`${emp.employee_id}-${skill.skill_name}-${idx}`} className="text-xs">
          {/* Employee info only once per employee */}
          {idx === 0 && skillIndex === 0 && (
            <>
              <td rowSpan={emp.skills.reduce((acc, s) => acc + (s.sub_skills.length || 1), 0)} className="px-2 py-1 text-xs font-medium border">
                {emp.employee_name}
              </td>
              <td rowSpan={emp.skills.reduce((acc, s) => acc + (s.sub_skills.length || 1), 0)} className="px-2 py-1 text-xs border">
                {emp.employee_id}
              </td>
            </>
          )}

          {/* Skill column only once per skill */}
          {idx === 0 && (
            <td rowSpan={subSkills.length} className="px-2 py-1 text-xs font-medium border">
              {skill.skill_name}
            </td>
          )}

          <td className="px-2 py-1 text-xs border">{sub.name}</td>
          <td className="px-2 py-1 text-xs flex items-center space-x-1 border">
            {renderStars(sub.proficiency)}
            <span>({sub.proficiency ?? '-'}/5)</span>
          </td>
          <td className="px-2 py-1 text-xs border">{sub.experience ?? '-'} yrs</td>
          <td className="px-2 py-1 text-xs border">{sub.hasCertification ? 'Certified' : 'Not Certified'}</td>
          <td className="px-2 py-1 text-xs border">{sub.status || '-'}</td>

          {/* Coverage column only once per employee */}
          {idx === 0 && skillIndex === 0 && (
  <td
    rowSpan={emp.skills.reduce((acc, s) => acc + (s.sub_skills.length || 1), 0)}
    className={`px-2 py-1 text-xs border font-semibold text-center
      ${
        emp.coverage >= 80
          ? "bg-green-100 text-green-700"
          : emp.coverage >= 50
          ? "bg-yellow-100 text-yellow-700"
          : "bg-red-100 text-red-700"
      }`}
  >
    {emp.coverage !== undefined ? `${emp.coverage}%` : "-"}
  </td>
)}

        </tr>
      ));
    })
  )}
</tbody>






          </table>
        </div>

       <div className="flex justify-between items-center px-5 py-3 border-t border-gray-200 bg-gray-50">
  <button
    disabled={page === 1}
    onClick={() => setPage(p => Math.max(1, p - 1))}
    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
  >
    Previous
  </button>
  <span className="text-sm text-gray-600">
    Page {page} of {totalPages}
  </span>
  <button
    disabled={page === totalPages}
    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
  >
    Next
  </button>
</div>

      </div>
    </div>
  );
}
