// import { useState, useEffect } from "react";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
// import { ChevronDown, ChevronRight, X, ChevronLeft, ChevronRight as ChevronRightIcon, Search } from "lucide-react";

// // --- Custom hook for debouncing a value ---
// const useDebounce = <T,>(value: T, delay: number): T => {
//     const [debouncedValue, setDebouncedValue] = useState<T>(value);
//     useEffect(() => {
//         const handler = setTimeout(() => {
//             setDebouncedValue(value);
//         }, delay);
//         return () => {
//             clearTimeout(handler);
//         };
//     }, [value, delay]);
//     return debouncedValue;
// };

// // --- Interfaces for fetched data ---
// interface MasterSkill {
//   id: number;
//   skill_name: string;
//   employee_count: number;
//   total_employees: number;
// }

// interface PaginatedMasterSkills {
//   master_skills: MasterSkill[];
//   total_skills: number;
//   page: number;
//   page_size: number;
// }

// interface MasterSkillMetrics {
//   skill_name: string;
//   total_employees: number;
//   employees_with_skill_count: number;
//   subskill_breakdown: { subskill_id: number; subskill_name: string; employee_percentage: number }[];
// }

// interface SubskillMetrics {
//   subskill_name: string;
//   total_employees: number;
//   employees_with_subskill_count: number;
//   certification_data: { name: string; value: number }[];
//   proficiency_data: { proficiency: string; count: number }[];
//   experience_data: { bucket: string; count: number }[];
// }

// // --- Recharts colors ---
// const PIE_COLORS = ['#0088FE', '#FF8042'];
// const BAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// // --- Modal Components for Reusability ---

// interface MasterSkillModalProps {
//   data: MasterSkillMetrics | null;
//   onClose: () => void;
// }

// const MasterSkillModal = ({ data, onClose }: MasterSkillModalProps) => {
//   if (!data) return null;

//   const skilledPercentage = data.total_employees > 0
//     ? (data.employees_with_skill_count / data.total_employees) * 100
//     : 0;
//   const notSkilledPercentage = 100 - skilledPercentage;
  
//   const skillCoverageData = [
//     { name: 'Skilled', value: skilledPercentage },
//     { name: 'Not Skilled', value: notSkilledPercentage },
//   ];

//   const subskillData = data.subskill_breakdown.map(s => ({
//     ...s,
//     percentage: s.employee_percentage
//   }));

//   return (
//     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
//       <div className="relative bg-white p-6 rounded-lg shadow-xl max-w-6xl w-full mx-4">
//         <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
//           <X size={24} />
//         </button>
//         <h2 className="text-2xl font-bold mb-4">{data.skill_name} Dashboard</h2>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
//           <div className="bg-gray-50 p-4 rounded-lg md:col-span-1">
//             <h3 className="text-lg font-semibold text-center mb-2">Overall Skill Coverage</h3>
//             <p className="text-sm text-gray-500 text-center mb-4">{data.employees_with_skill_count} out of {data.total_employees} employees</p>
//             <ResponsiveContainer width="100%" height={350}>
//               <PieChart>
//                 <Pie
//                   data={skillCoverageData}
//                   dataKey="value"
//                   nameKey="name"
//                   cx="50%"
//                   cy="50%"
//                   outerRadius={100}
//                   fill="#8884d8"
//                   label={({ name, value }) => typeof value === 'number' ? `${name}: ${value.toFixed(1)}%` : name}
//                 >
//                   {skillCoverageData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : value} />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
          
//           <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
//             <h3 className="text-lg font-semibold text-center mb-2">Sub-skill Adoption by Employees</h3>
//             <ResponsiveContainer width="100%" height={350}>
//               <BarChart data={subskillData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis 
//                   dataKey="subskill_name" 
//                   angle={-45} 
//                   textAnchor="end" 
//                   height={120}
//                   interval={0}
//                   tick={{ fontSize: 11 }}
//                 />
//                 <YAxis 
//                   label={{ value: 'Employees (%)', angle: -90, position: 'insideLeft', offset: -10 }}
//                   width={80}
//                   tickFormatter={(value) => typeof value === 'number' ? `${value.toFixed(0)}%` : value}
//                 />
//                 <Tooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : value} />
//                 <Legend />
//                 <Bar dataKey="percentage" fill="#4B5563" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Helper function to calculate dynamic Y-axis ticks
// const getDynamicTicks = (maxCount: number) => {
//     let step = 1;
//     if (maxCount > 10) step = 5;
//     if (maxCount > 50) step = 10;
//     if (maxCount > 100) step = 25;
//     if (maxCount > 200) step = 50;
//     if (maxCount > 500) step = 100;
//     if (maxCount > 1000) step = 200;

//     const endValue = Math.ceil(maxCount / step) * step;
//     const ticks = [];
//     for (let i = 0; i <= endValue; i += step) {
//         ticks.push(i);
//     }
//     return ticks;
// };

// interface SubskillModalProps {
//   data: SubskillMetrics | null;
//   onClose: () => void;
// }

// const SubskillModal = ({ data, onClose }: SubskillModalProps) => {
//   if (!data) return null;

//   // Pre-process data to ensure all X-axis values are present
//   const fullExperienceData = [
//     { bucket: '< 1 year', count: 0 },
//     { bucket: '1-2 years', count: 0 },
//     { bucket: '2-3 years', count: 0 },
//     { bucket: '3-4 years', count: 0 },
//     { bucket: '4-5 years', count: 0 },
//     { bucket: '5-6 years', count: 0 },
//     { bucket: '6-7 years', count: 0 },
//     { bucket: '7-8 years', count: 0 },
//     { bucket: '8-9 years', count: 0 },
//     { bucket: '9-10 years', count: 0 },
//     { bucket: '10+ years', count: 0 },
//   ];
//   const experienceMap = new Map(data.experience_data.map(item => [item.bucket, item.count]));
//   const formattedExperienceData = fullExperienceData.map(item => ({
//     ...item,
//     count: experienceMap.get(item.bucket) || 0,
//   }));
//   const maxExperienceCount = Math.max(...formattedExperienceData.map(d => d.count), 0);
//   const experienceTicks = getDynamicTicks(maxExperienceCount);

//   // --- Corrected Proficiency Data Preprocessing (plural 'Stars') ---
//   const fullProficiencyData = [
//     { proficiency: '1 Stars', count: 0 },
//     { proficiency: '2 Stars', count: 0 },
//     { proficiency: '3 Stars', count: 0 },
//     { proficiency: '4 Stars', count: 0 },
//     { proficiency: '5 Stars', count: 0 },
//   ];
//   const proficiencyMap = new Map(data.proficiency_data.map(item => [item.proficiency, item.count]));
//   const formattedProficiencyData = fullProficiencyData.map(item => ({
//     ...item,
//     count: proficiencyMap.get(item.proficiency) || 0,
//   }));
//   const maxProficiencyCount = Math.max(...formattedProficiencyData.map(d => d.count), 0);
//   const proficiencyTicks = getDynamicTicks(maxProficiencyCount);


//   const skilledPercentage = data.total_employees > 0
//     ? (data.employees_with_subskill_count / data.total_employees) * 100
//     : 0;
//   const notSkilledPercentage = 100 - skilledPercentage;
  
//   const skillCoverageData = [
//     { name: 'Skilled', value: skilledPercentage },
//     { name: 'Not Skilled', value: notSkilledPercentage },
//   ];

//   return (
//     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
//       <div className="relative bg-white p-6 rounded-lg shadow-xl max-w-7xl w-full mx-4">
//         <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
//           <X size={24} />
//         </button>
//         <h2 className="text-2xl font-bold mb-4">{data.subskill_name} Metrics</h2>
        
//         <div className="flex flex-row overflow-x-auto space-x-6 pb-4">
          
//           <div className="bg-gray-50 p-4 rounded-lg flex-shrink-0 w-[420px]">
//             <h3 className="text-lg font-semibold text-center mb-2">Overall Sub-skill Coverage</h3>
//             <p className="text-sm text-gray-500 text-center mb-4">{data.employees_with_subskill_count} out of {data.total_employees} employees</p>
//             <ResponsiveContainer width="100%" height={300}>
//               <PieChart>
//                 <Pie
//                   data={skillCoverageData}
//                   dataKey="value"
//                   nameKey="name"
//                   cx="50%"
//                   cy="50%"
//                   outerRadius={100}
//                   fill="#8884d8"
//                   label={({ name, value }) => typeof value === 'number' ? `${name}: ${value.toFixed(1)}%` : name}
//                 >
//                   {skillCoverageData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>

//           <div className="bg-gray-50 p-4 rounded-lg flex-shrink-0 w-[420px]">
//             <h3 className="text-lg font-semibold text-center mb-2">Experience Distribution</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={formattedExperienceData} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis 
//                   dataKey="bucket" 
//                   angle={-45} 
//                   textAnchor="end" 
//                   height={100}
//                   interval={0}
//                   tick={{ fontSize: 10 }}
//                 />
//                 <YAxis 
//                   label={{ value: 'Number of Employees', angle: -90, position: 'insideLeft', style: { fontSize: 10 }, offset: -5 }}
//                   width={90}
//                   tickFormatter={(value) => String(parseInt(value))}
//                   domain={[0, experienceTicks[experienceTicks.length - 1]]}
//                   ticks={experienceTicks}
//                 />
//                 <Tooltip />
//                 <Legend />
//                 <Bar dataKey="count" fill="#3B82F6" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
          
//           <div className="bg-gray-50 p-4 rounded-lg flex-shrink-0 w-[420px]">
//             <h3 className="text-lg font-semibold text-center mb-2">Proficiency Distribution</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={formattedProficiencyData} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis 
//                   dataKey="proficiency" 
//                   angle={-45} 
//                   textAnchor="end" 
//                   height={100}
//                   interval={0}
//                   tick={{ fontSize: 10 }}
//                 />
//                 <YAxis 
//                   label={{ value: 'Number of Employees', angle: -90, position: 'insideLeft', style: { fontSize: 10 }, offset: -5 }}
//                   width={90}
//                   tickFormatter={(value) => String(parseInt(value))}
//                   domain={[0, proficiencyTicks[proficiencyTicks.length - 1]]}
//                   ticks={proficiencyTicks}
//                 />
//                 <Tooltip />
//                 <Legend />
//                 <Bar dataKey="count" fill="#10B981" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
          
//           <div className="bg-gray-50 p-4 rounded-lg flex-shrink-0 w-[420px]">
//             <h3 className="text-lg font-semibold text-center mb-2">Certification Status</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <PieChart>
//                 <Pie
//                   data={data.certification_data}
//                   dataKey="value"
//                   nameKey="name"
//                   cx="50%"
//                   cy="50%"
//                   outerRadius={100}
//                   fill="#8884d8"
//                   label={({ name, value }) => typeof value === 'number' ? `${name}: ${value}` : name}
//                 >
//                   {data.certification_data.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };


// // Main Dashboard Component
// export default function DashboardPage() {
//   const [masterSkills, setMasterSkills] = useState<MasterSkill[]>([]);
//   const [masterSkillModalData, setMasterSkillModalData] = useState<MasterSkillMetrics | null>(null);
//   const [expandedMasterSkillData, setExpandedMasterSkillData] = useState<MasterSkillMetrics | null>(null);
//   const [subskillModalData, setSubskillModalData] = useState<SubskillMetrics | null>(null);
//   const [expandedMasterSkillId, setExpandedMasterSkillId] = useState<number | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [modalLoading, setModalLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [pageSize] = useState(10);
//   const [totalSkills, setTotalSkills] = useState(0);
//   const [searchTerm, setSearchTerm] = useState('');
//   const debouncedSearchTerm = useDebounce(searchTerm, 500);

//   useEffect(() => {
//     const fetchMasterSkills = async () => {
//       try {
//         setLoading(true);
//         const token = localStorage.getItem("token");
//         const url = new URL(`${BACKEND_URL}/dashboard/master-skills`);
//         url.searchParams.append('page', String(page));
//         url.searchParams.append('page_size', String(pageSize));
//         if (debouncedSearchTerm) {
//           url.searchParams.append('search', debouncedSearchTerm);
//         }

//         const res = await fetch(url.toString(), {
//           headers: token ? { Authorization: `Bearer ${token}` } : {},
//         });
//         if (!res.ok) throw new Error("Failed to fetch master skills.");
//         const data: PaginatedMasterSkills = await res.json();
//         setMasterSkills(data.master_skills);
//         setTotalSkills(data.total_skills);
//         setLoading(false);

//         // Auto-expand if only one result is found via search
//         if (debouncedSearchTerm && data.total_skills === 1 && data.page === 1) {
//             setExpandedMasterSkillId(data.master_skills[0].id);
//             // Also load the subskill data immediately for the expand feature
//             handleToggleExpand(data.master_skills[0].id);
//         }

//       } catch (err) {
//         console.error(err);
//         setError("Failed to load dashboard data. Please check your network.");
//         setLoading(false);
//       }
//     };
//     fetchMasterSkills();
//   }, [page, pageSize, debouncedSearchTerm]);

//   const handleMasterSkillView = async (skillId: number) => {
//     setModalLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       const res = await fetch(`${BACKEND_URL}/dashboard/master-skill/${skillId}`, {
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//       });
//       if (!res.ok) throw new Error("Failed to fetch skill data.");
//       const data = await res.json();
//       setMasterSkillModalData(data);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to load skill details.");
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleToggleExpand = async (skillId: number) => {
//     if (expandedMasterSkillId === skillId) {
//       setExpandedMasterSkillId(null);
//       setExpandedMasterSkillData(null);
//     } else {
//       setExpandedMasterSkillId(skillId);
//       setModalLoading(true);
//       try {
//         const token = localStorage.getItem("token");
//         const res = await fetch(`${BACKEND_URL}/dashboard/master-skill/${skillId}`, {
//           headers: token ? { Authorization: `Bearer ${token}` } : {},
//         });
//         if (!res.ok) throw new Error("Failed to fetch skill data.");
//         const data = await res.json();
//         setExpandedMasterSkillData(data);
//       } catch (err) {
//         console.error(err);
//         alert("Failed to load skill details.");
//       } finally {
//         setModalLoading(false);
//       }
//     }
//   };
  
//   const handleSubskillView = async (subskillId: number) => {
//     setModalLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       const res = await fetch(`${BACKEND_URL}/dashboard/sub-skill/${subskillId}`, {
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//       });
//       if (!res.ok) throw new Error("Failed to fetch sub-skill data.");
//       const data = await res.json();
//       setSubskillModalData(data);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to load sub-skill details.");
//     } finally {
//       setModalLoading(false);
//     }
//   };
  
//   const subskills = expandedMasterSkillId && expandedMasterSkillData && expandedMasterSkillData.subskill_breakdown ? 
//                       expandedMasterSkillData.subskill_breakdown : [];

//   const totalPages = Math.ceil(totalSkills / pageSize);

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">

//       {/* Search Bar */}
//       <div className="mb-4 flex justify-center">
//         <div className="relative flex items-center max-w-lg w-full">
//           <Search className="absolute left-3 text-gray-400" size={18} />
//           <input
//             type="text"
//             placeholder="Search by skill or sub-skill name..."
//             value={searchTerm}
//             onChange={(e) => {
//               setSearchTerm(e.target.value);
//               if (page !== 1) setPage(1); // Reset to page 1 on new search
//             }}
//             className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//           />
//         </div>
//       </div>

//       {loading ? (
//         <div className="flex justify-center items-center h-96">
//           <p className="text-gray-500">Loading master skills...</p>
//         </div>
//       ) : error ? (
//         <div className="flex justify-center items-center h-96 text-red-500">
//           <p>{error}</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           <div className="overflow-x-auto border rounded-lg shadow-sm">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-bold-500 uppercase tracking-wider w-1/2">
//                     Skill Name
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-bold-500 uppercase tracking-wider w-1/4">
//                     Employees with Skill
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-bold-500 uppercase tracking-wider w-1/4">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {masterSkills.length > 0 ? (
//                   masterSkills.map((skill) => (
//                     <>
//                       <tr key={skill.id}>
//                         <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-500">
//                           {skill.skill_name}
//                         </td>
//                         <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
//                           {skill.employee_count} / {skill.total_employees}
//                         </td>
//                         <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
//                           <div className="flex items-center space-x-3">
//                             <button
//                               onClick={() => handleMasterSkillView(skill.id)}
//                               className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
//                             >
//                               View Charts
//                             </button>
//                             <button
//                               onClick={() => handleToggleExpand(skill.id)}
//                               className="flex items-center space-x-1 text-xs font-medium text-gray-600 hover:text-gray-900"
//                             >
//                               <span>Subskills</span>
//                               {expandedMasterSkillId === skill.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                       {expandedMasterSkillId === skill.id && (
//                         <tr className="bg-gray-50">
//                           <td colSpan={3} className="px-6 py-3">
//                             <h4 className="text-sm font-semibold mb-2">Sub-skills:</h4>
//                             <ul className="space-y-1">
//                               {subskills.length > 0 ? (
//                                 subskills.map((sub, index) => (
//                                   <li key={index} className="flex justify-between items-center bg-white p-2 rounded-md">
//                                     <span className="text-sm">{sub.subskill_name}</span>
//                                     <button
//                                       onClick={() => handleSubskillView(sub.subskill_id)}
//                                       className="px-3 py-1 text-xs text-green-600 border border-green-600 rounded-md hover:bg-green-50"
//                                     >
//                                       View Metrics
//                                     </button>
//                                   </li>
//                                 ))
//                               ) : (
//                                 <p className="text-gray-500 text-sm">No sub-skills found for this master skill.</p>
//                               )}
//                             </ul>
//                           </td>
//                         </tr>
//                       )}
//                     </>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
//                       No master skills found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination Controls */}
//           <nav className="flex items-center justify-between mt-4">
//             <div className="text-sm text-gray-700">
//               Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, totalSkills)}</span> of <span className="font-medium">{totalSkills}</span> results
//             </div>
//             <div className="ml-4 flex items-center space-x-2">
//               <button
//                 onClick={() => setPage(prev => Math.max(prev - 1, 1))}
//                 disabled={page <= 1}
//                 className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
//               >
//                 <ChevronLeft size={16} /> Previous
//               </button>
//               <button
//                 onClick={() => setPage(prev => prev + 1)}
//                 disabled={page >= totalPages}
//                 className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
//               >
//                 Next <ChevronRightIcon size={16} />
//               </button>
//             </div>
//           </nav>
//         </div>
//       )}

//       {/* Loading overlay for modals */}
//       {modalLoading && (
//         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
//           <p className="text-white text-lg">Loading charts...</p>
//         </div>
//       )}

//       {/* Modals */}
//       {masterSkillModalData && (
//         <MasterSkillModal
//           data={masterSkillModalData}
//           onClose={() => setMasterSkillModalData(null)}
//         />
//       )}
//       {subskillModalData && (
//         <SubskillModal
//           data={subskillModalData}
//           onClose={() => setSubskillModalData(null)}
//         />
//       )}
//     </div>
//   );
// }



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