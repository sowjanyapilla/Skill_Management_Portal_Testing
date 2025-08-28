import React, { useState, useEffect } from 'react';
import { Plus, Minus, Star, X } from 'lucide-react';
import { SubSkillData } from '../types';

interface AddSkillCardProps {
  onSubmit: (skillData: any) => void;
  onCancel: () => void;
  onSubmitAndAddNew?: (skillData: any) => void; // ✅ new
}

export default function AddSkillCard({ onSubmit, onCancel,  onSubmitAndAddNew, }: AddSkillCardProps) {
  const [masterSkills, setMasterSkills] = useState<{ id: number; skill_name: string }[]>([]);
  const [subSkillsOptions, setSubSkillsOptions] = useState<{ id: number; subskill_name: string }[]>([]);
  const [selectedMasterSkill, setSelectedMasterSkill] = useState<number | "">("");
  const [subSkills, setSubSkills] = useState<SubSkillData[]>([
    { id: undefined, name: '', proficiency: 1, experience: 0, hasCertification: false, certificationFile: null }
  ]);
  const [errors, setErrors] = useState<string[]>(['']);
  const [successMessage, setSuccessMessage] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Fetch master skills
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
  }, []);

  // Fetch sub-skills on master skill change
  const handleMasterSkillChange = async (skillId: number) => {
    setSelectedMasterSkill(skillId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/skills/sub-skills/${skillId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setSubSkillsOptions(data);
      // Reset subSkills and errors when the master skill changes
      setSubSkills([
        { id: undefined, name: '', proficiency: 1, experience: 0, hasCertification: false, certificationFile: null }
      ]);
      setErrors(['']);
    } catch (err) {
      console.error("Failed to fetch sub-skills:", err);
    }
  };

  const addSubSkill = () => {
    setSubSkills(prevSkills => [
      ...prevSkills,
      { id: undefined, name: '', proficiency: 1, experience: 0, hasCertification: false, certificationFile: null }
    ]);
    setErrors(prevErrors => [...prevErrors, '']);
  };

  const removeSubSkill = (index: number) => {
    setSubSkills(prevSkills => prevSkills.filter((_, i) => i !== index));
    setErrors(prevErrors => prevErrors.filter((_, i) => i !== index));
  };
 
  // 🚀 CORRECTED: Centralized validation in one update function
  const updateSubSkill = (index: number, field: keyof SubSkillData, value: any) => {
    setSubSkills(prevSkills => {
      const updated = [...prevSkills];
      const subSkillToUpdate = { ...updated[index], [field]: value };
      let newProficiency = subSkillToUpdate.proficiency;
      let newError = '';

      // Check validation rules after updating either experience or proficiency
      if (
        (field === 'experience' || field === 'proficiency') &&
        subSkillToUpdate.experience <= 2 &&
        subSkillToUpdate.proficiency > 2
      ) {
        newProficiency = 2; // Automatically cap proficiency at 2
        newError = 'Proficiency cannot be more than 2 for experience ≤ 2 years';
      }

      // Update the state with the potentially corrected values
      updated[index] = {
        ...subSkillToUpdate,
        proficiency: newProficiency,
      };

      // Set the error message
      setErrors(prevErrors => {
        const newErrors = [...prevErrors];
        newErrors[index] = newError;
        return newErrors;
      });

      return updated;
    });
  };

  // Simplified: only calls the main update function
  const handleStarClick = (index: number, starValue: number) => {
    updateSubSkill(index, 'proficiency', starValue);
  };

  const renderStars = (proficiency: number, experience: number, index: number) => (
    <div>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(index, star)}
            className="focus:outline-none"
          >
            <Star className={`w-5 h-5 ${star <= proficiency ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-200'}`} />
          </button>
        ))}
      </div>
      {errors[index] && <p className="text-xs text-red-500 mt-1">{errors[index]}</p>}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterSkill) return alert("Please select a master skill");
    if (subSkills.some(s => !s.id)) return alert("Please select a sub-skill for all entries");
    
    // 🛑 CRITICAL FINAL VALIDATION: Check for errors before submitting
    for (let i = 0; i < subSkills.length; i++) {
        const subSkill = subSkills[i];
        if (subSkill.experience <= 2 && subSkill.proficiency > 2) {
            return alert("Proficiency cannot be more than 2 for experience ≤ 2 years. Please correct your selections before submitting.");
        }
    }
    if (errors.some(error => error)) {
        return alert("Please fix the errors before submitting.");
    }

    const payload = {
      skill_name: masterSkills.find(s => s.id === selectedMasterSkill)?.skill_name,
      sub_skills: subSkills.map(s => ({
        subskill_name: s.name,
        employee_proficiency: s.proficiency,
        experience: s.experience,
        certification_file_url: s.certificationFile ? (s.certificationFile instanceof File ? s.certificationFile.name : s.certificationFile) : null,
        certification_creation_date: s.certificationCreationDate || null,
        certification_expiration_date: s.certificationExpirationDate || null,
      }))
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/skills/`, {
        method: 'POST',
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to add skill");
      }
      const data = await res.json();
      onSubmit(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Custom submit wrapper (so we can call it from both buttons)
// Custom submit wrapper (returns data instead of closing automatically)
const handleCustomSubmit = async (): Promise<any | null> => {
  if (!selectedMasterSkill) {
    alert("Please select a master skill");
    return null;
  }
  if (subSkills.some((s) => !s.id)) {
    alert("Please select a sub-skill for all entries");
    return null;
  }
  for (let i = 0; i < subSkills.length; i++) {
    const subSkill = subSkills[i];
    if (subSkill.experience <= 2 && subSkill.proficiency > 2) {
      alert("Proficiency cannot be more than 2 for experience ≤ 2 years.");
      return null;
    }
  }
  if (errors.some((error) => error)) {
    alert("Please fix the errors before submitting.");
    return null;
  }

  const payload = {
    skill_name: masterSkills.find((s) => s.id === selectedMasterSkill)?.skill_name,
    sub_skills: subSkills.map((s) => ({
      subskill_name: s.name,
      employee_proficiency: s.proficiency,
      experience: s.experience,
      certification_file_url: s.certificationFile
        ? s.certificationFile instanceof File
          ? s.certificationFile.name
          : s.certificationFile
        : null,
      certification_creation_date: s.certificationCreationDate || null,
      certification_expiration_date: s.certificationExpirationDate || null,
    })),
  };

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BACKEND_URL}/skills/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to add skill");
    }
    const data = await res.json();
    setSuccessMessage("Skill has been submitted successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
    return data; // ✅ return data instead of auto-calling onSubmit
    
  } catch (err: any) {
    alert(err.message);
    return null;
  }
};


// Reset form for "Add New Skill"
const resetForm = () => {
  setSelectedMasterSkill("");
  setSubSkills([
    {
      id: undefined,
      name: "",
      proficiency: 1,
      experience: 0,
      hasCertification: false,
      certificationFile: null,
      certificationCreationDate: "",
      certificationExpirationDate: "",
    },
  ]);
  setErrors([""]);
};

  return (
  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-800">Add New Skill</h3>
      <button
        onClick={onCancel}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    <form onSubmit={async (e) => {e.preventDefault(); await handleCustomSubmit();}}
        className="space-y-4"
      >
      {/* Master Skill */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Master Skill</label>
        <select
          value={selectedMasterSkill}
          onChange={(e) => handleMasterSkillChange(Number(e.target.value))}
          required
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Skill</option>
          {masterSkills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.skill_name}
            </option>
          ))}
        </select>
      </div>

      {/* Sub-skill Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 w-40">Sub-skill</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">Exp</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">Proficiency</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 w-28">Certified</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 w-52">Certification Details</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {subSkills.map((subSkill, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                {/* Sub-skill */}
                <td className="px-3 py-2">
                  <select
                    value={subSkill.id ?? ""}
                    onChange={(e) => {
                      const selectedId = Number(e.target.value);
                      const selected = subSkillsOptions.find((opt) => opt.id === selectedId);
                      updateSubSkill(index, "id", selected ? selected.id : undefined);
                      updateSubSkill(index, "name", selected ? selected.subskill_name : "");
                    }}
                    required
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Select</option>
                    {subSkillsOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.subskill_name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Experience */}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={subSkill.experience}
                    onChange={(e) =>
                      updateSubSkill(index, "experience", parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </td>

                {/* Proficiency */}
                {/* Proficiency */}
<td className="px-3 py-2 align-top">
  <div className="flex flex-col">
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleStarClick(index, star)}
          className="focus:outline-none"
        >
          <Star
            className={`w-4 h-4 ${
              star <= subSkill.proficiency
                ? "text-yellow-400 fill-current"
                : "text-gray-300 hover:text-yellow-200"
            }`}
          />
        </button>
      ))}
    </div>

    {/* Inline validation message (shows when exp ≤ 2 and user picked > 2) */}
    {errors[index] && (
      <span className="mt-1 text-xs text-red-500">{errors[index]}</span>
    )}
  </div>
</td>

                {/* Certified Checkbox */}
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={subSkill.hasCertification}
                    onChange={(e) =>
                      updateSubSkill(index, "hasCertification", e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>

                {/* Conditional Certification Details */}
                <td className="px-3 py-2">
  {subSkill.hasCertification && (
    <div className="flex items-center gap-2">
      {/* File Upload */}
      <input
        type="file"
        accept=".pdf,.jpg,.png"
        onChange={(e) =>
          updateSubSkill(index, "certificationFile", e.target.files?.[0] || null)
        }
        className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 
                   file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
      />

      {/* Certification Creation Date */}
      <input
        type="date"
        value={subSkill.certificationCreationDate ?? ""}
        onChange={(e) =>
          updateSubSkill(index, "certificationCreationDate", e.target.value)
        }
        className="w-28 px-2 py-1 border rounded text-xs"
      />

      {/* Certification Expiration Date */}
      <input
        type="date"
        value={subSkill.certificationExpirationDate ?? ""}
        onChange={(e) =>
          updateSubSkill(index, "certificationExpirationDate", e.target.value)
        }
        className="w-28 px-2 py-1 border rounded text-xs"
      />
    </div>
  )}
</td>


                {/* Remove */}
                <td className="px-3 py-2 text-right">
                  {subSkills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubSkill(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

          <div className="flex justify-start mt-3">
        <button
          type="button"
          onClick={addSubSkill}
          className="flex items-center px-3 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1" /> Add More Sub-skill
        </button>
         </div>
      {/* Actions */}
      {/* Actions */}
<div className="flex justify-end gap-4 mt-6">
  {/* Normal Submit */}
  <button
    type="button"
    onClick={async () => {
      const data = await handleCustomSubmit();
      if (data) {
        onSubmit(data); // ✅ close card only here
      }
    }}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  >
    Submit Skill
  </button>

  {/* Submit and Add New Skill */}
  <button
    type="button"
    onClick={async () => {
      const data = await handleCustomSubmit();
      if (data) {
        resetForm(); // ✅ keep card open for another entry
      }
    }}
    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
  >
    Submit & Add New Skill
  </button>
  {successMessage && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {successMessage}
        </div>
      )}
</div>

    </form>
  </div>
);
}