import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon, Search } from "lucide-react";
// Import the modals and their types from the shared component file
import { MasterSkillModal, SubskillModal, MasterSkillMetrics, SubskillMetrics } from '../components/SkillModals';

// --- Custom hook for debouncing a value ---
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// --- Interfaces for fetched data ---
interface MasterSkill {
    id: number;
    skill_name: string;
    employee_count: number;
    total_employees: number;
}

interface PaginatedMasterSkills {
    master_skills: MasterSkill[];
    total_skills: number;
    page: number;
    page_size: number;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Main Dashboard Component
export default function DashboardPage() {
    const [masterSkills, setMasterSkills] = useState<MasterSkill[]>([]);
    const [masterSkillModalData, setMasterSkillModalData] = useState<MasterSkillMetrics | null>(null);
    const [expandedMasterSkillData, setExpandedMasterSkillData] = useState<MasterSkillMetrics | null>(null);
    const [subskillModalData, setSubskillModalData] = useState<SubskillMetrics | null>(null);
    const [expandedMasterSkillId, setExpandedMasterSkillId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalSkills, setTotalSkills] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    useEffect(() => {
        const fetchMasterSkills = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const url = new URL(`${BACKEND_URL}/dashboard/master-skills`);
                url.searchParams.append('page', String(page));
                url.searchParams.append('page_size', String(pageSize));
                if (debouncedSearchTerm) {
                    url.searchParams.append('search', debouncedSearchTerm);
                }

                const res = await fetch(url.toString(), {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) throw new Error("Failed to fetch master skills.");
                const data: PaginatedMasterSkills = await res.json();
                setMasterSkills(data.master_skills);
                setTotalSkills(data.total_skills);
                setLoading(false);

                // Auto-expand if only one result is found via search
                if (debouncedSearchTerm && data.total_skills === 1 && data.page === 1) {
                    setExpandedMasterSkillId(data.master_skills[0].id);
                    handleToggleExpand(data.master_skills[0].id);
                }

            } catch (err) {
                console.error(err);
                setError("Failed to load dashboard data. Please check your network.");
                setLoading(false);
            }
        };
        fetchMasterSkills();
    }, [page, pageSize, debouncedSearchTerm]);

    const handleMasterSkillView = async (skillId: number) => {
        setModalLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BACKEND_URL}/dashboard/master-skill/${skillId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error("Failed to fetch skill data.");
            const data = await res.json();
            setMasterSkillModalData(data);
        } catch (err) {
            console.error(err);
            alert("Failed to load skill details.");
        } finally {
            setModalLoading(false);
        }
    };

    const handleToggleExpand = async (skillId: number) => {
        if (expandedMasterSkillId === skillId) {
            setExpandedMasterSkillId(null);
            setExpandedMasterSkillData(null);
        } else {
            setExpandedMasterSkillId(skillId);
            setModalLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${BACKEND_URL}/dashboard/master-skill/${skillId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) throw new Error("Failed to fetch skill data.");
                const data = await res.json();
                setExpandedMasterSkillData(data);
            } catch (err) {
                console.error(err);
                alert("Failed to load skill details.");
            } finally {
                setModalLoading(false);
            }
        }
    };
    
    const handleSubskillView = async (subskillId: number) => {
        setModalLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BACKEND_URL}/dashboard/sub-skill/${subskillId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error("Failed to fetch sub-skill data.");
            const data = await res.json();
            setSubskillModalData(data);
        } catch (err) {
            console.error(err);
            alert("Failed to load sub-skill details.");
        } finally {
            setModalLoading(false);
        }
    };
    
    const subskills = expandedMasterSkillId && expandedMasterSkillData && expandedMasterSkillData.subskill_breakdown ? 
        expandedMasterSkillData.subskill_breakdown : [];

    const totalPages = Math.ceil(totalSkills / pageSize);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Search Bar */}
            <div className="mb-4 flex justify-center">
                <div className="relative flex items-center max-w-lg w-full">
                    <Search className="absolute left-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by skill or sub-skill name..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (page !== 1) setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <p className="text-gray-500">Loading master skills...</p>
                </div>
            ) : error ? (
                <div className="flex justify-center items-center h-96 text-red-500">
                    <p>{error}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="overflow-x-auto border rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-bold-500 uppercase tracking-wider w-1/2">
                                        Skill Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-bold-500 uppercase tracking-wider w-1/4">
                                        Employees with Skill
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-bold-500 uppercase tracking-wider w-1/4">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {masterSkills.length > 0 ? (
                                    masterSkills.map((skill) => (
                                        <>
                                            <tr key={skill.id}>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-500">
                                                    {skill.skill_name}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {skill.employee_count} / {skill.total_employees}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center space-x-3">
                                                        <button
                                                            onClick={() => handleMasterSkillView(skill.id)}
                                                            className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                                                        >
                                                            View Charts
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleExpand(skill.id)}
                                                            className="flex items-center space-x-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                                                        >
                                                            <span>Subskills</span>
                                                            {expandedMasterSkillId === skill.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedMasterSkillId === skill.id && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={3} className="px-6 py-3">
                                                        <h4 className="text-sm font-semibold mb-2">Sub-skills:</h4>
                                                        <ul className="space-y-1">
                                                            {subskills.length > 0 ? (
                                                                subskills.map((sub, index) => (
                                                                    <li key={index} className="flex justify-between items-center bg-white p-2 rounded-md">
                                                                        <span className="text-sm">{sub.subskill_name}</span>
                                                                        <button
                                                                            onClick={() => handleSubskillView(sub.subskill_id)}
                                                                            className="px-3 py-1 text-xs text-green-600 border border-green-600 rounded-md hover:bg-green-50"
                                                                        >
                                                                            View Metrics
                                                                        </button>
                                                                    </li>
                                                                ))
                                                            ) : (
                                                                <p className="text-gray-500 text-sm">No sub-skills found for this master skill.</p>
                                                            )}
                                                        </ul>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                            No master skills found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <nav className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, totalSkills)}</span> of <span className="font-medium">{totalSkills}</span> results
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                            <button
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page <= 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <button
                                onClick={() => setPage(prev => prev + 1)}
                                disabled={page >= totalPages}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next <ChevronRightIcon size={16} />
                            </button>
                        </div>
                    </nav>
                </div>
            )}
            {/* Loading overlay for modals */}
            {modalLoading && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                    <p className="text-white text-lg">Loading charts...</p>
                </div>
            )}
            {/* Modals */}
            {masterSkillModalData && (
                <MasterSkillModal
                    data={masterSkillModalData}
                    onClose={() => setMasterSkillModalData(null)}
                />
            )}
            {subskillModalData && (
                <SubskillModal
                    data={subskillModalData}
                    onClose={() => setSubskillModalData(null)}
                />
            )}
        </div>
    );
}