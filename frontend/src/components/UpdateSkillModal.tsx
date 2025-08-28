import { useState } from "react";
import { X } from "lucide-react";
import { SubSkill } from "../types";

interface UpdateSkillModalProps {
  subSkill: SubSkill;
  onClose: () => void;
  onUpdate: (updatedSubSkill: Partial<SubSkill>) => void;
}

export default function UpdateSkillModal({
  subSkill,
  onClose,
  onUpdate,
}: UpdateSkillModalProps) {
  const [proficiency, setProficiency] = useState(subSkill.proficiency_level);
  const [experience, setExperience] = useState(subSkill.experience_years);
  const [hasCertification, setHasCertification] = useState(subSkill.has_certification);
  const [managerComments, setManagerComments] = useState(subSkill.manager_comments || "");

  const handleSubmit = () => {
    onUpdate({
      proficiency_level: proficiency,
      experience_years: experience,
      has_certification: hasCertification,
    //   manager_comments: managerComments,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-lg w-96 p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X />
        </button>
        <h3 className="text-lg font-semibold mb-4">Update Sub-Skill</h3>

        <div className="space-y-3 text-sm">
          <div>
            <label className="block mb-1">Proficiency (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={proficiency}
              onChange={(e) => setProficiency(Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Experience (years)</label>
            <input
              type="number"
              min={0}
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              className="w-full px-3 py-1 border rounded"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={hasCertification}
              onChange={(e) => setHasCertification(e.target.checked)}
            />
            <span>Has Certification</span>
          </div>

          <div>
            <label className="block mb-1">Manager Comments</label>
            <textarea
              value={managerComments}
              onChange={(e) => setManagerComments(e.target.value)}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
