
// import { useState, useEffect } from "react";
// import { Plus, Minus, Star, X, Pencil } from "lucide-react";

// interface SubSkillData {
//   id: number | undefined;
//   name: string;
//   proficiency: number;
//   experienceYears: number;
//   experienceMonths: number;
//   totalExperienceInMonths: number;
//   hasCertification: boolean;
//   certificationFile: File | null;
//   certificationCreationDate?: string;
//   certificationExpirationDate?: string;
// }

// interface AddSkillResult {
//   inserted?: string[];
//   duplicates?: string[];
//   skill?: any;
// }

// interface AddSkillCardProps {
//   onSubmit: (skillData: AddSkillResult) => void;
//   onCancel: () => void;
//   onSubmitAndAddNew?: (skillData: AddSkillResult) => void;
//   onUpdateDuplicateSkill: (subSkillId: number) => void;
// }

// // Custom hook for debouncing a value
// const useDebounce = <T,>(value: T, delay: number): T => {
//   const [debouncedValue, setDebouncedValue] = useState<T>(value);
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);
//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);
//   return debouncedValue;
// };

// export default function AddSkillCard({ onSubmit, onCancel, onSubmitAndAddNew, onUpdateDuplicateSkill }: AddSkillCardProps) {
//   const [masterSkills, setMasterSkills] = useState<{ id: number; skill_name: string }[]>([]);
//   const [subSkillsOptions, setSubSkillsOptions] = useState<{ id: number; subskill_name: string }[]>([]);
//   const [selectedMasterSkill, setSelectedMasterSkill] = useState<number | "">("");
//   const [subSkills, setSubSkills] = useState<SubSkillData[]>([
//     { id: undefined, name: '', proficiency: 1, experienceYears: 0, experienceMonths: 0, totalExperienceInMonths: 0, hasCertification: false, certificationFile: null }
//   ]);
//   const [errors, setErrors] = useState<string[]>(['']);
//   const [popupMessage, setPopupMessage] = useState<{ text: string; type: "success" | "warning" | "error" } | null>(null);
//   const [duplicateErrors, setDuplicateErrors] = useState<Record<number, string | null>>({});
//   const [lastCheckedIds, setLastCheckedIds] = useState<number[]>([]);
//   const [resumeFile, setResumeFile] = useState<File | null>(null);

//   const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
//   const selectedSubSkillIds = subSkills.map(s => s.id).filter(Boolean) as number[];
//   const debouncedSubSkillIds = useDebounce(selectedSubSkillIds, 500);

//   useEffect(() => {
//     const fetchMasterSkills = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await fetch(`${BACKEND_URL}/skills/master-skills`, {
//           headers: token ? { Authorization: `Bearer ${token}` } : {}
//         });
//         const data = await res.json();
//         setMasterSkills(data);
//       } catch (err) {
//         console.error("Failed to fetch master skills:", err);
//       }
//     };
//     fetchMasterSkills();
//   }, [BACKEND_URL]);

//   useEffect(() => {
//     const checkDuplicates = async () => {
//       if (debouncedSubSkillIds.length === 0) {
//         if (Object.keys(duplicateErrors).length > 0) {
//           setDuplicateErrors({});
//         }
//         return;
//       }

//       if (
//         JSON.stringify(debouncedSubSkillIds.sort()) ===
//         JSON.stringify(lastCheckedIds.sort())
//       ) {
//         return;
//       }

//       try {
//         const token = localStorage.getItem("token");
//         const query = debouncedSubSkillIds.map(id => `subskill_ids=${id}`).join("&");
//         const res = await fetch(`${BACKEND_URL}/skills/check-duplicates?${query}`, {
//           headers: token ? { Authorization: `Bearer ${token}` } : {},
//         });

//         if (!res.ok) throw new Error("Failed to check for duplicates");

//         const data: { subskill_id: number; is_duplicate: boolean; subskill_name?: string }[] = await res.json();

//         const newDuplicateErrors: Record<number, string> = {};
//         data.forEach(item => {
//           if (item.is_duplicate) {
//             newDuplicateErrors[item.subskill_id] = `This skill already exists, click to update.`;
//           }
//         });

//         if (JSON.stringify(newDuplicateErrors) !== JSON.stringify(duplicateErrors)) {
//           setDuplicateErrors(newDuplicateErrors);
//         }

//         setLastCheckedIds([...debouncedSubSkillIds]);
//       } catch (err) {
//         console.error("Duplicate check failed:", err);
//       }
//     };

//     checkDuplicates();
//   }, [debouncedSubSkillIds, BACKEND_URL]);

//   const handleMasterSkillChange = async (skillId: number) => {
//     setSelectedMasterSkill(skillId);
//     try {
//       const token = localStorage.getItem("token");
//       const res = await fetch(`${BACKEND_URL}/skills/sub-skills/${skillId}`, {
//         headers: token ? { Authorization: `Bearer ${token}` } : {}
//       });
//       const data = await res.json();
//       setSubSkillsOptions(data);
//       setSubSkills([
//         { id: undefined, name: '', proficiency: 1, experienceYears: 0, experienceMonths: 0, totalExperienceInMonths: 0, hasCertification: false, certificationFile: null }
//       ]);
//       setErrors(['']);
//     } catch (err) {
//       console.error("Failed to fetch sub-skills:", err);
//     }
//   };

//   const addSubSkill = () => {
//     setSubSkills(prev => [...prev, { id: undefined, name: '', proficiency: 1, experienceYears: 0, experienceMonths: 0, totalExperienceInMonths: 0, hasCertification: false, certificationFile: null }]);
//     setErrors(prev => [...prev, '']);
//   };

//   const removeSubSkill = (index: number) => {
//     setSubSkills(prev => prev.filter((_, i) => i !== index));
//     setErrors(prev => prev.filter((_, i) => i !== index));
//   };

//   const updateSubSkill = (index: number, field: 'id' | 'name' | 'proficiency' | 'experienceYears' | 'experienceMonths' | 'hasCertification' | 'certificationFile' | 'certificationCreationDate' | 'certificationExpirationDate', value: any) => {
//     setSubSkills(prev => {
//       const updated = [...prev];
//       const subSkill = { ...updated[index], [field]: value };

//       if (field === 'experienceYears' || field === 'experienceMonths') {
//         const years = field === 'experienceYears' ? parseInt(value) : subSkill.experienceYears;
//         const months = field === 'experienceMonths' ? parseInt(value) : subSkill.experienceMonths;

//         let totalMonths = 0;
//         if (years === 11) { // 10+ years is handled as 11
//             totalMonths = 11 * 12 + months;
//         } else {
//             totalMonths = years * 12 + months;
//         }

//         subSkill.totalExperienceInMonths = totalMonths;
//       }

//       let newError = '';
//       const totalYears = subSkill.totalExperienceInMonths / 12;
//       if (totalYears <= 2 && subSkill.proficiency > 2) {
//         subSkill.proficiency = 2;
//         newError = 'Proficiency cannot be more than 2 for experience ≤ 2 years';
//       }
      
//       updated[index] = subSkill;
//       setErrors(prevErrors => {
//         const newErrors = [...prevErrors];
//         newErrors[index] = newError;
//         return newErrors;
//       });
//       return updated;
//     });
//   };

//   const handleStarClick = (index: number, starValue: number) => updateSubSkill(index, 'proficiency', starValue);

//   const handleSubmit = async (): Promise<AddSkillResult | null> => {
//     const hasInlineErrors = Object.values(duplicateErrors).some(error => error !== null);
//     if (hasInlineErrors) {
//       setPopupMessage({ text: "Please resolve duplicate skills before submitting.", type: "error" });
//       setTimeout(() => setPopupMessage(null), 4000);
//       return null;
//     }
//     if (!selectedMasterSkill) {
//       setPopupMessage({ text: "Select a master skill.", type: "error" });
//       setTimeout(() => setPopupMessage(null), 4000);
//       return null;
//     }
//     if (subSkills.some(s => !s.id)) {
//       setPopupMessage({ text: "Select sub-skill for all entries.", type: "error" });
//       setTimeout(() => setPopupMessage(null), 4000);
//       return null;
//     }
//     if (errors.some(e => e)) {
//       setPopupMessage({ text: "Fix errors before submitting.", type: "error" });
//       setTimeout(() => setPopupMessage(null), 4000);
//       return null;
//     }

//     const payload = {
//       skill_name: masterSkills.find(s => s.id === selectedMasterSkill)?.skill_name,
//       resume_file_url: resumeFile ? resumeFile.name : null,
//       sub_skills: subSkills.map(s => ({
//         subskill_name: s.name,
//         employee_proficiency: s.proficiency,
//         experience: s.totalExperienceInMonths, // Pass the calculated total months
//         certification_file_url: s.certificationFile instanceof File ? s.certificationFile.name : s.certificationFile || null,
//         certification_creation_date: s.certificationCreationDate || null,
//         certification_expiration_date: s.certificationExpirationDate || null,
//       }))
//     };

//     try {
//       const token = localStorage.getItem("token");
//       const res = await fetch(`${BACKEND_URL}/skills/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         setPopupMessage({ text: data.detail || "Failed to add skill", type: "error" });
//         return null;
//       }
//       const inserted = Array.isArray(data.inserted_skills) ? data.inserted_skills : [];
//       const duplicates = Array.isArray(data.duplicate_skills) ? data.duplicate_skills : [];
//       let msg = "";
//       if (inserted.length) msg += `✅ Successfully added: ${inserted.join(", ")}\n`;
//       if (duplicates.length) msg += `⚠️ Already exist: ${duplicates.join(", ")}\n Please update them in your My Skills dashboard.`;
//       setPopupMessage({ text: msg || "Skill has been submitted successfully.", type: duplicates.length > 0 ? "warning" : "success" });
//       setTimeout(() => setPopupMessage(null), 4000);
//       return { ...data, inserted, duplicates };
//     } catch (err: any) {
//       setPopupMessage({ text: err.message, type: "error" });
//       setTimeout(() => setPopupMessage(null), 4000);
//       return null;
//     }
//   };

//   const resetForm = () => {
//     setSelectedMasterSkill("");
//     setSubSkills([{ id: undefined, name: "", proficiency: 1, experienceYears: 0, experienceMonths: 0, totalExperienceInMonths: 0, hasCertification: false, certificationFile: null, certificationCreationDate: "", certificationExpirationDate: "" }]);
//     setErrors([""]);
//     setResumeFile(null);
//   };

//   const yearsOptions = Array.from({ length: 11 }, (_, i) => i);
//   const monthsOptions = Array.from({ length: 12 }, (_, i) => i);

//   return (
//     <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
//       <div className="flex justify-between items-center mb-4">
//         <h3 className="text-lg font-semibold text-gray-800">Add New Skill</h3>
//         <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
//           <X className="w-5 h-5" />
//         </button>
//       </div>

//       <form onSubmit={async (e) => { e.preventDefault(); const data = await handleSubmit(); if (data) onSubmit(data); }} className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Master Skill</label>
//           <select value={selectedMasterSkill} onChange={(e) => handleMasterSkillChange(Number(e.target.value))} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
//             <option value="">Select Skill</option>
//             {masterSkills.map(s => <option key={s.id} value={s.id}>{s.skill_name}</option>)}
//           </select>
//         </div>

//         <div className="overflow-x-visible border rounded-lg relative"> {/* Added relative to this container */}
//           <table className="min-w-full text-sm border-collapse">
//             <thead className="bg-gray-50 border-b">
//               <tr>
//                 <th className="px-3 py-2 text-left font-semibold text-gray-700 w-40">Sub-skill</th>
//                 <th className="px-3 py-2 text-center font-semibold text-gray-700 w-48">Exp</th>
//                 <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">Proficiency</th>
//                 <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">Certified</th>
//                 <th className="px-3 py-2 text-left font-semibold text-gray-700 w-40">Certification File</th>
//                 <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">Acquired Date</th>
//                 <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">Expiration Date</th>
//                 <th className="px-3 py-2"></th>
//                 <th className="px-3 py-2 text-left font-semibold text-gray-700 w-48">Notes / Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {subSkills.map((subSkill, index) => (
//                 <tr key={index} className="border-b hover:bg-gray-50">
//                   <td className="px-3 py-2">
//                     <div className="relative z-10"> {/* Added relative and z-index to the dropdown container */}
//                       <select
//                         value={subSkill.id ?? ""}
//                         onChange={(e) => {
//                           const selectedId = Number(e.target.value);
//                           const selected = subSkillsOptions.find(opt => opt.id === selectedId);
//                           updateSubSkill(index, "id", selected ? selected.id : undefined);
//                           updateSubSkill(index, "name", selected ? selected.subskill_name : "");
//                         }}
//                         required
//                         className="w-full px-2 py-1 border rounded text-sm"
//                       >
//                         <option value="">Select</option>
//                         {(() => {
//                           const selectedSubSkillIds = subSkills
//                             .filter((_, i) => i !== index)
//                             .map(s => s.id)
//                             .filter(Boolean);

//                           return subSkillsOptions.map(opt => (
//                             <option
//                               key={opt.id}
//                               value={opt.id}
//                               disabled={selectedSubSkillIds.includes(opt.id) || !!duplicateErrors[opt.id]}
//                             >
//                               {opt.subskill_name}
//                             </option>
//                           ));
//                         })()}
//                       </select>
//                     </div>
//                   </td>
//                   <td className="px-3 py-2">
//                     <div className="flex flex-row items-center gap-2">
//                       <div className="flex items-center gap-1">
//                         <label className="text-xs text-gray-500">Years</label>
//                         <select 
//                           value={subSkill.experienceYears} 
//                           onChange={e => updateSubSkill(index, "experienceYears", parseInt(e.target.value))}
//                           className="w-16 px-2 py-1 border rounded text-sm"
//                         >
//                           {yearsOptions.map(y => (
//                             <option key={`year-${y}`} value={y}>{y < 10 ? y : '10+'}</option>
//                           ))}
//                         </select>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <label className="text-xs text-gray-500">Months</label>
//                         <select 
//                           value={subSkill.experienceMonths} 
//                           onChange={e => updateSubSkill(index, "experienceMonths", parseInt(e.target.value))}
//                           className="w-16 px-2 py-1 border rounded text-sm"
//                         >
//                           {monthsOptions.map(m => (
//                             <option key={`month-${m}`} value={m}>{m}</option>
//                           ))}
//                         </select>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-3 py-2 align-top">
//                     <div className="flex flex-col">
//                       <div className="flex space-x-1">
//                         {[1, 2, 3, 4, 5].map(star => <button key={star} type="button" onClick={() => handleStarClick(index, star)} className="focus:outline-none">
//                           <Star className={`w-4 h-4 ${star <= subSkill.proficiency ? "text-yellow-400 fill-current" : "text-gray-300 hover:text-yellow-200"}`} />
//                         </button>)}
//                       </div>
//                       {errors[index] && <span className="mt-1 text-xs text-red-500">{errors[index]}</span>}
//                     </div>
//                   </td>
//                   <td className="px-3 py-2 text-center">
//                     <input type="checkbox" checked={subSkill.hasCertification} onChange={e => updateSubSkill(index, "hasCertification", e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//                   </td>
//                   <td className="px-3 py-2">
//                     {subSkill.hasCertification && (
//                       <input
//                         type="file"
//                         accept=".pdf,.jpg,.png"
//                         onChange={e =>
//                           updateSubSkill(index, "certificationFile", e.target.files?.[0] || null)
//                         }
//                         className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded
//                           file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
//                       />
//                     )}
//                   </td>
//                   <td className="px-3 py-2">
//                     {subSkill.hasCertification && (
//                       <input
//                         type="date"
//                         value={subSkill.certificationCreationDate ?? ""}
//                         onChange={e =>
//                           updateSubSkill(index, "certificationCreationDate", e.target.value)
//                         }
//                         className="w-28 px-2 py-1 border rounded text-xs"
//                       />
//                     )}
//                   </td>
//                   <td className="px-3 py-2">
//                     {subSkill.hasCertification && (
//                       <input
//                         type="date"
//                         value={subSkill.certificationExpirationDate ?? ""}
//                         onChange={e =>
//                           updateSubSkill(index, "certificationExpirationDate", e.target.value)
//                         }
//                         className="w-28 px-2 py-1 border rounded text-xs"
//                       />
//                     )}
//                   </td>
//                   <td className="px-3 py-2 text-right">
//                     {subSkills.length > 1 && (
//                       <button type="button" onClick={() => removeSubSkill(index)} className="text-red-500 hover:text-red-700">
//                         <Minus className="w-4 h-4" />
//                       </button>
//                     )}
//                   </td>
//                   <td className="px-3 py-2">
//                     {subSkill.id && duplicateErrors[subSkill.id] && (
//                       <div className="flex flex-col items-start gap-1">
//                         <span className="text-xs text-red-500 font-semibold">{duplicateErrors[subSkill.id]}</span>
//                         <button
//                           type="button"
//                           onClick={() => onUpdateDuplicateSkill(subSkill.id as number)}
//                           className="flex items-center gap-1 text-blue-500 text-xs hover:underline"
//                         >
//                           <Pencil className="w-4 h-4" />
//                           Update Sub-skill
//                         </button>
//                       </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <div className="flex justify-start mt-3">
//           <button type="button" onClick={addSubSkill} className="flex items-center px-3 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-sm">
//             <Plus className="w-4 h-4 mr-1" /> Add More Sub-skill
//           </button>
//         </div>

//         {/* New Resume Upload Section */}
//         <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-6">
//           <div className="w-full md:w-auto flex-1">
//             <label className="block text-sm font-medium text-gray-700 mb-1">Optional: Upload Latest Resume</label>
//             <input
//               type="file"
//               accept=".pdf,.doc,.docx"
//               onChange={e => setResumeFile(e.target.files?.[0] || null)}
//               className="block w-full text-sm text-gray-500
//               file:mr-4 file:py-2 file:px-4
//               file:rounded-full file:border-0
//               file:text-sm file:font-semibold
//               file:bg-purple-50 file:text-purple-700
//               hover:file:bg-purple-100"
//             />
//             {resumeFile && (
//               <p className="mt-1 text-xs text-gray-500">Selected file: {resumeFile.name}</p>
//             )}
//           </div>
          
//           <div className="flex justify-end gap-4 md:mt-0">
//             <button
//               type="button"
//               onClick={async () => {
//                 const data = await handleSubmit();
//                 if (data) {
//                   onSubmit(data);
//                 }
//               }}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               Submit Skill
//             </button>

//             <button
//               type="button"
//               onClick={async () => {
//                 const data = await handleSubmit();
//                 if (data) {
//                   resetForm();
//                   if (onSubmitAndAddNew) onSubmitAndAddNew(data);
//                 }
//               }}
//               className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
//             >
//               Submit & Add New Skill
//             </button>
//           </div>
//         </div>

//         {popupMessage && (
//           <div
//             className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg animate-fade-in
//           ${popupMessage.type === "success" ? "bg-green-500" : ""}
//           ${popupMessage.type === "warning" ? "bg-yellow-500" : ""}
//           ${popupMessage.type === "error" ? "bg-red-500" : ""}`}
//           >
//             {popupMessage.text.split("\n").map((line, i) => (
//               <div key={i}>{line}</div>
//             ))}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { Plus, Minus, Star, X, Pencil } from "lucide-react";

interface SubSkillData {
  id: number | undefined;
  name: string;
  proficiency: number;
  experienceYears: number;
  experienceMonths: number;
  totalExperienceInMonths: number;
  hasCertification: boolean;
  certificationFile: File | null;
  certificationCreationDate?: string;
  certificationExpirationDate?: string;
}

interface AddSkillResult {
  inserted?: string[];
  duplicates?: string[];
  skill?: any;
}

interface AddSkillCardProps {
  onSubmit: (skillData: AddSkillResult) => void;
  onCancel: () => void;
  onSubmitAndAddNew?: (skillData: AddSkillResult) => void;
  onUpdateDuplicateSkill: (subSkillId: number) => void;
}

// Custom hook for debouncing a value
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

export default function AddSkillCard({ onSubmit, onCancel, onSubmitAndAddNew, onUpdateDuplicateSkill }: AddSkillCardProps) {
  const [masterSkills, setMasterSkills] = useState<{ id: number; skill_name: string }[]>([]);
  const [subSkillsOptions, setSubSkillsOptions] = useState<{ id: number; subskill_name: string }[]>([]);
  const [selectedMasterSkill, setSelectedMasterSkill] = useState<number | "">("");
  const [subSkills, setSubSkills] = useState<SubSkillData[]>([
    { id: undefined, name: '', proficiency: 1, experienceYears: 0, experienceMonths: 0, totalExperienceInMonths: 0, hasCertification: false, certificationFile: null }
  ]);
  const [errors, setErrors] = useState<string[]>(['']);
  const [popupMessage, setPopupMessage] = useState<{ text: string; type: "success" | "warning" | "error" } | null>(null);
  const [duplicateErrors, setDuplicateErrors] = useState<Record<number, string | null>>({});
  const [lastCheckedIds, setLastCheckedIds] = useState<number[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const selectedSubSkillIds = subSkills.map(s => s.id).filter(Boolean) as number[];
  const debouncedSubSkillIds = useDebounce(selectedSubSkillIds, 500);

  useEffect(() => {
    const fetchMasterSkills = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BACKEND_URL}/skills/master-skills`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        setMasterSkills(data);
      } catch (err) {
        console.error("Failed to fetch master skills:", err);
      }
    };
    fetchMasterSkills();
  }, [BACKEND_URL]);

  useEffect(() => {
    const checkDuplicates = async () => {
      if (debouncedSubSkillIds.length === 0) {
        if (Object.keys(duplicateErrors).length > 0) {
          setDuplicateErrors({});
        }
        return;
      }

      if (
        JSON.stringify(debouncedSubSkillIds.sort()) ===
        JSON.stringify(lastCheckedIds.sort())
      ) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const query = debouncedSubSkillIds.map(id => `subskill_ids=${id}`).join("&");
        const res = await fetch(`${BACKEND_URL}/skills/check-duplicates?${query}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error("Failed to check for duplicates");

        const data: { subskill_id: number; is_duplicate: boolean; subskill_name?: string }[] = await res.json();

        const newDuplicateErrors: Record<number, string> = {};
        data.forEach(item => {
          if (item.is_duplicate) {
            newDuplicateErrors[item.subskill_id] = `This skill already exists, click to update.`;
          }
        });

        if (JSON.stringify(newDuplicateErrors) !== JSON.stringify(duplicateErrors)) {
          setDuplicateErrors(newDuplicateErrors);
        }

        setLastCheckedIds([...debouncedSubSkillIds]);
      } catch (err) {
        console.error("Duplicate check failed:", err);
      }
    };

    checkDuplicates();
  }, [debouncedSubSkillIds, BACKEND_URL]);

  const handleMasterSkillChange = async (skillId: number) => {
    setSelectedMasterSkill(skillId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/skills/sub-skills/${skillId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setSubSkillsOptions(data);
      setSubSkills([
        { id: undefined, name: '', proficiency: 1, experienceYears: 0, experienceMonths: 0, totalExperienceInMonths: 0, hasCertification: false, certificationFile: null }
      ]);
      setErrors(['']);
    } catch (err) {
      console.error("Failed to fetch sub-skills:", err);
    }
  };

  const addSubSkill = () => {
    setSubSkills(prev => [...prev, { id: undefined, name: '', proficiency: 1, experienceYears: 0, experienceMonths: 0, totalExperienceInMonths: 0, hasCertification: false, certificationFile: null }]);
    setErrors(prev => [...prev, '']);
  };

  const removeSubSkill = (index: number) => {
    setSubSkills(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubSkill = (index: number, field: 'id' | 'name' | 'proficiency' | 'experienceYears' | 'experienceMonths' | 'hasCertification' | 'certificationFile' | 'certificationCreationDate' | 'certificationExpirationDate', value: any) => {
    setSubSkills(prev => {
      const updated = [...prev];
      const subSkill = { ...updated[index], [field]: value };

      if (field === 'experienceYears' || field === 'experienceMonths') {
        const years = field === 'experienceYears' ? parseInt(value) : subSkill.experienceYears;
        const months = field === 'experienceMonths' ? parseInt(value) : subSkill.experienceMonths;
        subSkill.totalExperienceInMonths = years * 12 + months;
      }
      
      const totalYears = subSkill.totalExperienceInMonths / 12;
      const proficiency = subSkill.proficiency;

      let newError = '';
      let maxProficiency = 0;

      // Determine the maximum allowed proficiency based on total years of experience
      if (totalYears > 10) {
        maxProficiency = 5;
      } else if (totalYears > 5) {
        maxProficiency = 4;
      } else if (totalYears > 2) {
        maxProficiency = 3;
      } else {
        maxProficiency = 2;
      }

      // Check if the current proficiency exceeds the maximum allowed
      if (proficiency > maxProficiency) {
        subSkill.proficiency = maxProficiency; // Reset to the highest allowed value
        newError = `Proficiency cannot be more than ${maxProficiency} stars for your experience level.`;
      }

      updated[index] = subSkill;
      setErrors(prevErrors => {
        const newErrors = [...prevErrors];
        newErrors[index] = newError;
        return newErrors;
      });
      return updated;
    });
  };

  const handleStarClick = (index: number, starValue: number) => updateSubSkill(index, 'proficiency', starValue);

  const handleSubmit = async (): Promise<AddSkillResult | null> => {
    const hasInlineErrors = Object.values(duplicateErrors).some(error => error !== null);
    if (hasInlineErrors) {
      setPopupMessage({ text: "Please resolve duplicate skills before submitting.", type: "error" });
      setTimeout(() => setPopupMessage(null), 4000);
      return null;
    }
    if (!selectedMasterSkill) {
      setPopupMessage({ text: "Select a master skill.", type: "error" });
      setTimeout(() => setPopupMessage(null), 4000);
      return null;
    }
    if (subSkills.some(s => !s.id)) {
      setPopupMessage({ text: "Select sub-skill for all entries.", type: "error" });
      setTimeout(() => setPopupMessage(null), 4000);
      return null;
    }
    if (errors.some(e => e)) {
      setPopupMessage({ text: "Fix errors before submitting.", type: "error" });
      setTimeout(() => setPopupMessage(null), 4000);
      return null;
    }

    const payload = {
      skill_name: masterSkills.find(s => s.id === selectedMasterSkill)?.skill_name,
      resume_file_url: resumeFile ? resumeFile.name : null,
      sub_skills: subSkills.map(s => ({
        subskill_name: s.name,
        employee_proficiency: s.proficiency,
        experience: s.totalExperienceInMonths, // Pass the calculated total months
        certification_file_url: s.certificationFile instanceof File ? s.certificationFile.name : s.certificationFile || null,
        certification_creation_date: s.certificationCreationDate || null,
        certification_expiration_date: s.certificationExpirationDate || null,
      }))
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/skills/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setPopupMessage({ text: data.detail || "Failed to add skill", type: "error" });
        return null;
      }
      const inserted = Array.isArray(data.inserted_skills) ? data.inserted_skills : [];
      const duplicates = Array.isArray(data.duplicate_skills) ? data.duplicate_skills : [];
      let msg = "";
      if (inserted.length) msg += `✅ Successfully added: ${inserted.join(", ")}\n`;
      if (duplicates.length) msg += `⚠️ Already exist: ${duplicates.join(", ")}\n Please update them in your My Skills dashboard.`;
      setPopupMessage({ text: msg || "Skill has been submitted successfully.", type: duplicates.length > 0 ? "warning" : "success" });
      setTimeout(() => setPopupMessage(null), 4000);
      return { ...data, inserted, duplicates };
    } catch (err: any) {
      setPopupMessage({ text: err.message, type: "error" });
      setTimeout(() => setPopupMessage(null), 4000);
      return null;
    }
  };

  const resetForm = () => {
    setSelectedMasterSkill("");
    setSubSkills([{ id: undefined, name: "", proficiency: 1, experienceYears: 0, experienceMonths: 0, totalExperienceInMonths: 0, hasCertification: false, certificationFile: null, certificationCreationDate: "", certificationExpirationDate: "" }]);
    setErrors([""]);
    setResumeFile(null);
  };

  const yearsOptions = Array.from({ length: 12 }, (_, i) => i);
  const monthsOptions = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Add New Skill</h3>
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={async (e) => { e.preventDefault(); const data = await handleSubmit(); if (data) onSubmit(data); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Master Skill</label>
          <select value={selectedMasterSkill} onChange={(e) => handleMasterSkillChange(Number(e.target.value))} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select Skill</option>
            {masterSkills.map(s => <option key={s.id} value={s.id}>{s.skill_name}</option>)}
          </select>
        </div>

        <div className="overflow-x-visible border rounded-lg relative"> {/* Added relative to this container */}
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-40">Sub-skill</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 w-48">Exp</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">Proficiency</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">Certified</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-40">Certification File</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">Acquired Date</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">Expiration Date</th>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-48">Notes / Action</th>
              </tr>
            </thead>
            <tbody>
              {subSkills.map((subSkill, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="relative z-10"> {/* Added relative and z-index to the dropdown container */}
                      <select
                        value={subSkill.id ?? ""}
                        onChange={(e) => {
                          const selectedId = Number(e.target.value);
                          const selected = subSkillsOptions.find(opt => opt.id === selectedId);
                          updateSubSkill(index, "id", selected ? selected.id : undefined);
                          updateSubSkill(index, "name", selected ? selected.subskill_name : "");
                        }}
                        required
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="">Select</option>
                        {(() => {
                          const selectedSubSkillIds = subSkills
                            .filter((_, i) => i !== index)
                            .map(s => s.id)
                            .filter(Boolean);

                          return subSkillsOptions.map(opt => (
                            <option
                              key={opt.id}
                              value={opt.id}
                              disabled={selectedSubSkillIds.includes(opt.id) || !!duplicateErrors[opt.id]}
                            >
                              {opt.subskill_name}
                            </option>
                          ));
                        })()}
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-row items-center gap-2">
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-500">Years</label>
                        <select 
                          value={subSkill.experienceYears} 
                          onChange={e => updateSubSkill(index, "experienceYears", parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border rounded text-sm"
                        >
                          {yearsOptions.map(y => (
                            <option key={`year-${y}`} value={y}>{y <= 10 ? y : '10+'}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-500">Months</label>
                        <select 
                          value={subSkill.experienceMonths} 
                          onChange={e => updateSubSkill(index, "experienceMonths", parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border rounded text-sm"
                        >
                          {monthsOptions.map(m => (
                            <option key={`month-${m}`} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-col">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map(star => <button key={star} type="button" onClick={() => handleStarClick(index, star)} className="focus:outline-none">
                          <Star className={`w-4 h-4 ${star <= subSkill.proficiency ? "text-yellow-400 fill-current" : "text-gray-300 hover:text-yellow-200"}`} />
                        </button>)}
                      </div>
                      {errors[index] && <span className="mt-1 text-xs text-red-500">{errors[index]}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={subSkill.hasCertification} onChange={e => updateSubSkill(index, "hasCertification", e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  <td className="px-3 py-2">
                    {subSkill.hasCertification && (
                      <input
                        type="file"
                        accept=".pdf,.jpg,.png"
                        onChange={e =>
                          updateSubSkill(index, "certificationFile", e.target.files?.[0] || null)
                        }
                        className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded
                          file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {subSkill.hasCertification && (
                      <input
                        type="date"
                        value={subSkill.certificationCreationDate ?? ""}
                        onChange={e =>
                          updateSubSkill(index, "certificationCreationDate", e.target.value)
                        }
                        className="w-28 px-2 py-1 border rounded text-xs"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {subSkill.hasCertification && (
                      <input
                        type="date"
                        value={subSkill.certificationExpirationDate ?? ""}
                        onChange={e =>
                          updateSubSkill(index, "certificationExpirationDate", e.target.value)
                        }
                        className="w-28 px-2 py-1 border rounded text-xs"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {subSkills.length > 1 && (
                      <button type="button" onClick={() => removeSubSkill(index)} className="text-red-500 hover:text-red-700">
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {subSkill.id && duplicateErrors[subSkill.id] && (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs text-red-500 font-semibold">{duplicateErrors[subSkill.id]}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateDuplicateSkill(subSkill.id as number)}
                          className="flex items-center gap-1 text-blue-500 text-xs hover:underline"
                        >
                          <Pencil className="w-4 h-4" />
                          Update Sub-skill
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-start mt-3">
          <button type="button" onClick={addSubSkill} className="flex items-center px-3 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-1" /> Add More Sub-skill
          </button>
        </div>

        {/* New Resume Upload Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-6">
          <div className="w-full md:w-auto flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Optional: Upload Latest Resume</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={e => setResumeFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-purple-50 file:text-purple-700
              hover:file:bg-purple-100"
            />
            {resumeFile && (
              <p className="mt-1 text-xs text-gray-500">Selected file: {resumeFile.name}</p>
            )}
          </div>
          
          <div className="flex justify-end gap-4 md:mt-0">
            <button
              type="button"
              onClick={async () => {
                const data = await handleSubmit();
                if (data) {
                  onSubmit(data);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit Skill
            </button>

            <button
              type="button"
              onClick={async () => {
                const data = await handleSubmit();
                if (data) {
                  resetForm();
                  if (onSubmitAndAddNew) onSubmitAndAddNew(data);
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit & Add New Skill
            </button>
          </div>
        </div>

        {popupMessage && (
          <div
            className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-lg animate-fade-in
          ${popupMessage.type === "success" ? "bg-green-500" : ""}
          ${popupMessage.type === "warning" ? "bg-yellow-500" : ""}
          ${popupMessage.type === "error" ? "bg-red-500" : ""}`}
          >
            {popupMessage.text.split("\n").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}