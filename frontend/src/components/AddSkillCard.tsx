import React, { useState, useEffect } from 'react';
import { Plus, Minus, Upload, Star, X } from 'lucide-react';
import { SubSkillData } from '../types';

interface AddSkillCardProps {
  onSubmit: (skillData: any) => void;
  onCancel: () => void;
}

export default function AddSkillCard({ onSubmit, onCancel }: AddSkillCardProps) {
  const [skills, setSkills] = useState<{ id: number; skill_name: string }[]>([]);
  const [subSkillsOptions, setSubSkillsOptions] = useState<{ id: number; subskill_name: string }[]>([]);
  const [skillId, setSkillId] = useState<number | "">("");
  const [subSkills, setSubSkills] = useState<SubSkillData[]>([
    { id: 0, name: '', proficiency: 1, experience: 0, hasCertification: false, employeeName: '', employeeId: '' }
  ]);
  const [errors, setErrors] = useState<string[]>(subSkills.map(() => ''));
  const [success, setSuccess] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Fetch master skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BACKEND_URL}/skills/master-skills`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error("Failed to fetch skills");
        const data = await response.json();
        setSkills(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSkills();
  }, []);

  // Fetch sub-skills when master skill changes
  const handleSkillChange = async (skillId: number) => {
    setSkillId(skillId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}/skills/sub-skills/${skillId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch sub-skills");
      const data = await response.json();
      setSubSkillsOptions(data);
      // Reset subSkills array
      setSubSkills([{ id: 0, name: '', proficiency: 1, experience: 0, hasCertification: false }]);
    } catch (err) {
      console.error(err);
    }
  };

  const addSubSkill = () => {
    setSubSkills([...subSkills, { id: 0, name: '', proficiency: 1, experience: 0, hasCertification: false }]);
  };

  const removeSubSkill = (index: number) => {
    setSubSkills(subSkills.filter((_, i) => i !== index));
  };

  const updateSubSkill = (index: number, field: keyof SubSkillData, value: any) => {
    const updated = [...subSkills];
    updated[index] = { ...updated[index], [field]: value };
    setSubSkills(updated);

    if (field === 'proficiency') {
      const newErrors = [...errors];
      newErrors[index] = '';
      setErrors(newErrors);
    }
  };

  const renderStars = (proficiency: number, experience: number, index: number, onChange: (value: number) => void) => {
    return (
      <div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                if (experience <= 2 && star > 2) {
                  const newErrors = [...errors];
                  newErrors[index] = 'Proficiency cannot be more than 2 for experience ≤ 2 years';
                  setErrors(newErrors);
                  return;
                }
                onChange(star);
              }}
              className="focus:outline-none"
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  star <= proficiency ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-200'
                }`}
              />
            </button>
          ))}
        </div>
        {errors[index] && <p className="text-xs text-red-500 mt-1">{errors[index]}</p>}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (skillId && subSkills.every(s => s.name || s.id)) {
      const payload = {
        skill_name: skills.find(s => s.id === skillId)?.skill_name,
        sub_skills: subSkills.map(s => ({
          sub_skill_name: subSkillsOptions.find(opt => opt.id === s.id)?.subskill_name || s.name,
          employee_proficiency: s.proficiency,
          experience_years: s.experience,
          has_certification: s.hasCertification,
          certification_file_url: s.certificationFile ? s.certificationFile.name : null
        }))
      };

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BACKEND_URL}/skills/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || "Failed to add skill");
        }

        const data = await response.json();
        console.log("Skill added:", data);
        onSubmit(data);
        setSuccess(true);
      } catch (error: any) {
        console.error("Error adding skill:", error.message);
        alert(error.message);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Add New Skill</h3>
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Master Skill Dropdown */}
        <select
          value={skillId}
          onChange={(e) => handleSkillChange(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
          required
        >
          <option value="">Select a skill</option>
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.skill_name}
            </option>
          ))}
        </select>

        {/* Sub-skills */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Sub-skills</label>
            <button
              type="button"
              onClick={addSubSkill}
              className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Sub-skill
            </button>
          </div>

          {subSkills.map((subSkill, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-medium text-gray-700">Sub-skill #{index + 1}</h4>
                {subSkills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubSkill(index)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Sub-skill</label>
                <select
                  value={subSkill.id || ""}
                  onChange={(e) => updateSubSkill(index, 'id', Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select sub-skill</option>
                  {subSkillsOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.subskill_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={subSkill.experience}
                    onChange={(e) => updateSubSkill(index, 'experience', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 2.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Proficiency Level</label>
                  {renderStars(subSkill.proficiency, subSkill.experience, index, (value) => updateSubSkill(index, 'proficiency', value))}
                  <p className="text-xs text-gray-500 mt-1">Click stars to set proficiency (1-5)</p>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={subSkill.hasCertification}
                    onChange={(e) => updateSubSkill(index, 'hasCertification', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-600">I have certification for this skill</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Submit Skill
          </button>
        </div>
      </form>
    </div>
  );
}
