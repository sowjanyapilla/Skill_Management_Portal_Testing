// import React, { useState, useEffect } from "react";
// import { X } from "lucide-react";
// import { SubSkillUpdate } from "../types";

// interface UpdateSkillModalProps {
//   subSkill: SubSkillUpdate;
//   onClose: () => void;
//   onUpdate: (updated: SubSkillUpdate) => void;
// }

// export default function UpdateSkillModal({ subSkill, onClose, onUpdate }: UpdateSkillModalProps) {
//   const [proficiency_level, setProficiencyLevel] = useState(subSkill.proficiency_level);
//   const [experience_years, setExperienceYears] = useState(subSkill.experience_years);
//   const [has_certification, setHasCertification] = useState(subSkill.has_certification);
//   const [certificationFileUrl, setCertificationFileUrl] = useState(subSkill.certification_file_url || "");
//   const [certificationCreationDate, setCertificationCreationDate] = useState<string | null>(subSkill.certification_creation_date ?? null);
//   const [certificationExpirationDate, setCertificationExpirationDate] = useState<string | null>(subSkill.certification_expiration_date ?? null);

//   const [certificationFile, setCertificationFile] = useState<File | null>(null);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setCertificationFile(e.target.files[0]);
//       setCertificationFileUrl(e.target.files[0].name); // store filename or path
//       setHasCertification(true);
//     }
//   };

//   const handleSubmit = () => {
//     if (errorMessage) return;
//     if (!subSkill) return;

//     onUpdate({
//       ...subSkill,
//       proficiency_level,
//       experience_years,
//       has_certification,
//       certification_file_url: certificationFileUrl || undefined,
//       certification_creation_date: certificationCreationDate,
//       certification_expiration_date: certificationExpirationDate,
//     });
//     onClose();
//   };

//   useEffect(() => {
//     if (experience_years <= 2 && proficiency_level > 2) {
//       setErrorMessage("For experience ≤ 2 years, proficiency cannot be greater than 2.");
//     } else {
//       setErrorMessage(null);
//     }
//   }, [experience_years, proficiency_level]);

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
//       <div className="bg-white rounded-lg w-96 p-6 relative shadow-lg">
//         <button
//           onClick={onClose}
//           className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
//         >
//           <X />
//         </button>
//         <h3 className="text-lg font-semibold mb-4">Update Sub-Skill</h3>

//         <div className="mb-4 text-sm text-gray-700">
//           <p><strong>Skill:</strong> {subSkill.skill_name}</p>
//           <p><strong>Sub-skill:</strong> {subSkill.sub_skill_name}</p>
//         </div>

//         <div className="space-y-3 text-sm">
//           <div>
//             <label className="block mb-1">Experience (years)</label>
//             <input
//               type="number"
//               min={0}
//               value={experience_years}
//               onChange={(e) => setExperienceYears(Number(e.target.value))}
//               className="w-full px-3 py-2 border rounded text-sm"
//             />
//           </div>

//           <div>
//             <label className="block mb-1">Proficiency (1-5)</label>
//             <input
//               type="number"
//               min={1}
//               max={5}
//               value={proficiency_level}
//               onChange={(e) => setProficiencyLevel(Number(e.target.value))}
//               className="w-full px-3 py-2 border rounded text-sm"
//             />
//           </div>

//           {errorMessage && (
//             <p className="text-red-600 text-sm mb-2">{errorMessage}</p>
//           )}

//           <div>
//             <label className="block mb-1">Certification File</label>
//             <input
//               type="file"
//               onChange={handleFileChange}
//               className="w-full px-3 py-2 border rounded text-sm"
//             />
//             {certificationFileUrl && (
//               <p className="text-xs mt-1 text-gray-500">Current: {certificationFileUrl}</p>
//             )}
//           </div>

//           <div>
//             <label className="block mb-1">Certification Creation Date</label>
//             <input
//               type="date"
//               value={certificationCreationDate ?? ""}
//               onChange={(e) => setCertificationCreationDate(e.target.value)}
//               className="w-full px-3 py-2 border rounded text-sm"
//             />
//           </div>

//           <div>
//             <label className="block mb-1">Certification Expiration Date</label>
//             <input
//               type="date"
//               value={certificationExpirationDate ?? ""}
//               onChange={(e) => setCertificationExpirationDate(e.target.value)}
//               className="w-full px-3 py-2 border rounded text-sm"
//             />
//           </div>
//         </div>

//         <div className="mt-5 flex justify-end space-x-2">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             className={`px-4 py-2 rounded text-sm ${errorMessage ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
//             disabled={!!errorMessage}
//           >
//             Update
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { X, Star, ChevronDown, ChevronRight } from "lucide-react";
import { SubSkillUpdate } from "../types";

interface UpdateSkillModalProps {
  subSkill: SubSkillUpdate;
  onClose: () => void;
  onUpdate: (updated: SubSkillUpdate) => void;
}

export default function UpdateSkillModal({ subSkill, onClose, onUpdate }: UpdateSkillModalProps) {
  const [proficiency_level, setProficiencyLevel] = useState(subSkill.proficiency_level);
  const [experienceYears, setExperienceYears] = useState(0);
  const [experienceMonths, setExperienceMonths] = useState(0);
  const [totalExperienceInMonths, setTotalExperienceInMonths] = useState(subSkill.experience_years);
  const [has_certification, setHasCertification] = useState(!!subSkill.certification_file_url);
  const [certificationFileUrl, setCertificationFileUrl] = useState(subSkill.certification_file_url || "");
  const [certificationCreationDate, setCertificationCreationDate] = useState<string | null>(subSkill.certification_creation_date ?? null);
  const [certificationExpirationDate, setCertificationExpirationDate] = useState<string | null>(subSkill.certification_expiration_date ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const yearsOptions = Array.from({ length: 12 }, (_, i) => i);
  const monthsOptions = Array.from({ length: 12 }, (_, i) => i);

  // Effect to parse backend data (in months) into years and months for dropdowns
  useEffect(() => {
    if (subSkill.experience_years !== undefined && subSkill.experience_years !== null) {
      const years = Math.floor(subSkill.experience_years / 12);
      const months = subSkill.experience_years % 12;
      setExperienceYears(years > 10 ? 11 : years); // Handle 10+ years
      setExperienceMonths(months);
      setTotalExperienceInMonths(subSkill.experience_years);
    }
  }, [subSkill.experience_years]);
  
  // Effect to perform real-time validation on proficiency and experience
  useEffect(() => {
    const totalYears = totalExperienceInMonths / 12;
    const proficiency = proficiency_level;
    let maxProficiency = 0;

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
      setErrorMessage(`Proficiency cannot be more than ${maxProficiency} stars for your experience level.`);
    } else {
      setErrorMessage(null);
    }
  }, [totalExperienceInMonths, proficiency_level]);

  const handleExperienceChange = (field: 'years' | 'months', value: number) => {
    const newYears = field === 'years' ? value : experienceYears;
    const newMonths = field === 'months' ? value : experienceMonths;
    setExperienceYears(newYears);
    setExperienceMonths(newMonths);
    setTotalExperienceInMonths(newYears * 12 + newMonths);
  };

  const handleProficiencyChange = (starValue: number) => {
    setProficiencyLevel(starValue);
  };

  const handleSubmit = () => {
    if (errorMessage) return;
    if (!subSkill) return;

    onUpdate({
      ...subSkill,
      proficiency_level: proficiency_level,
      experience_years: totalExperienceInMonths, 
      certification_file_url: has_certification ? certificationFileUrl || undefined : undefined,
      certification_creation_date: has_certification ? certificationCreationDate : null,
      certification_expiration_date: has_certification ? certificationExpirationDate : null,
      has_certification: has_certification,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-lg w-96 p-6 relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X />
        </button>
        <h3 className="text-lg font-semibold mb-4">Update Sub-Skill</h3>

        <div className="mb-4 text-sm text-gray-700">
          <p><strong>Skill:</strong> {subSkill.skill_name}</p>
          <p><strong>Sub-skill:</strong> {subSkill.sub_skill_name}</p>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label className="block mb-1">Experience</label>
            <div className="flex space-x-2">
                <select
                    value={experienceYears}
                    onChange={(e) => handleExperienceChange('years', Number(e.target.value))}
                    className="w-1/2 px-3 py-2 border rounded text-sm"
                >
                    {yearsOptions.map(y => (
                        <option key={`year-${y}`} value={y}>{y <= 10 ? y : '10+'}</option>
                    ))}
                </select>
                <select
                    value={experienceMonths}
                    onChange={(e) => handleExperienceChange('months', Number(e.target.value))}
                    className="w-1/2 px-3 py-2 border rounded text-sm"
                >
                    {monthsOptions.map(m => (
                        <option key={`month-${m}`} value={m}>{m}</option>
                    ))}
                </select>
            </div>
          </div>

          <div>
            <label className="block mb-1">Proficiency</label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  type="button" 
                  onClick={() => handleProficiencyChange(star)}
                  className="focus:outline-none"
                >
                  <Star className={`w-6 h-6 ${star <= proficiency_level ? "text-yellow-400 fill-current" : "text-gray-300 hover:text-yellow-200"}`} />
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <p className="text-red-600 text-sm mb-2">{errorMessage}</p>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="has_certification"
              checked={has_certification}
              onChange={(e) => setHasCertification(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="has_certification" className="text-sm">Has Certification</label>
          </div>

          {has_certification && (
            <>
              <div>
                <label className="block mb-1">Certification File</label>
                <input
                  type="file"
                  onChange={(e) => setCertificationFileUrl(e.target.files?.[0]?.name || "")}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                 {certificationFileUrl && (
                  <p className="mt-1 text-xs text-gray-500">Current: {certificationFileUrl}</p>
                )}
              </div>

              <div>
                <label className="block mb-1">Acquired Date</label>
                <input
                  type="date"
                  value={certificationCreationDate ?? ""}
                  onChange={(e) => setCertificationCreationDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={certificationExpirationDate ?? ""}
                  onChange={(e) => setCertificationExpirationDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded text-sm ${errorMessage ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            disabled={!!errorMessage}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}