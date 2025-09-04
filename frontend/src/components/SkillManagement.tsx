import { useState, useEffect } from "react";
import { Edit, Trash, Plus, Minus, X, ChevronDown, ChevronUp, Search } from "lucide-react";

interface SubSkill {
  subskill_id: number;
  skill_id: number;
  subskill_name: string;
}

interface MasterSkill {
  skill_id: number;
  skill_name: string;
  subskills: SubSkill[];
}

export default function SkillManagementTab() {
  const [masterSkills, setMasterSkills] = useState<MasterSkill[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [isAddingMasterSkill, setIsAddingMasterSkill] = useState(false);
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'master' | 'subskill', id: number, name: string } | null>(null);

  // Form state
  const [masterForm, setMasterForm] = useState<Partial<MasterSkill>>({});
  const [subForm, setSubForm] = useState<Partial<SubSkill>>({});
  const [subSkillsInForm, setSubSkillsInForm] = useState<{ subskill_name: string }[]>([{ subskill_name: "" }]);

  // Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newSubSkills, setNewSubSkills] = useState<{ subskill_name: string }[]>([{ subskill_name: "" }]);

  // NOTE: This uses a hardcoded URL. In a real-world app, this would be configured more robustly.
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

  // Changed page size to 10 as per request
  const PAGE_SIZE = 10;

  // Function to toggle a master skill's expanded state
  const toggleExpanded = (skillId: number) => {
    setExpandedSkills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skillId)) {
        newSet.delete(skillId);
      } else {
        newSet.add(skillId);
      }
      return newSet;
    });
  };

  // Fetch all master skills
  const fetchMasterSkills = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/skills/master/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch skills");
      const data = await res.json();
      setMasterSkills(data.master_skills);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterSkills();
  }, [BASE_URL, token]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Filter skills based on search query
  const filteredSkills = masterSkills.filter(master =>
    master.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    master.subskills.some(sub => sub.subskill_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredSkills.length / PAGE_SIZE);
  const paginatedMasterSkills = filteredSkills.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Generic delete handler to open the modal
  const handleDeleteClick = (type: 'master' | 'subskill', id: number, name: string) => {
    setItemToDelete({ type, id, name });
    setShowDeleteModal(true);
  };

  // Function to confirm and perform the deletion
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;
    setShowDeleteModal(false);
    setLoading(true);

    try {
      const endpoint = type === 'master' ? `${BASE_URL}/skills/master/${id}` : `${BASE_URL}/skills/sub/${id}`;
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Failed to delete ${type === 'master' ? 'master skill' : 'subskill'}`);
      setSuccessMessage(data.message || `${type === 'master' ? 'Master skill' : 'Subskill'} deleted successfully`);
      fetchMasterSkills();
    } catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong with the deletion.");
      setLoading(false);
    } finally {
      setItemToDelete(null);
    }
  };

  // Save (Add/Edit Master OR Edit Sub)
  const handleSave = async () => {
    setErrorMessage(null);
    try {
      if (isAddingMasterSkill) {
        // CREATE MASTER
        const name = masterForm.skill_name?.trim();
        if (!name) return setErrorMessage("Master skill name cannot be empty.");
        const filtered = subSkillsInForm.filter((s) => s.subskill_name.trim() !== "");
        if (filtered.length === 0) return setErrorMessage("Add at least one sub-skill.");

        const res = await fetch(`${BASE_URL}/skills/master/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ skill_name: name, sub_skills: filtered }),
        });
        if (!res.ok) throw new Error("Failed to add master skill");
        setSuccessMessage("Master skill added successfully");
      } else if (isEditingSub && subForm.subskill_id) {
        // UPDATE SUB
        const newName = subForm.subskill_name?.trim();
        if (!newName) return setErrorMessage("Sub-skill name cannot be empty.");

        const res = await fetch(`${BASE_URL}/skills/sub/${subForm.subskill_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ subskill_name: newName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error("Failed to update sub-skill");
        setSuccessMessage(data.message || "Sub-skill updated successfully");
      } else if (masterForm.skill_id) {
        // UPDATE MASTER + ADD NEW SUB-SKILLS
        const name = masterForm.skill_name?.trim();
        if (!name) return setErrorMessage("Master skill name cannot be empty.");

        // 1. Update master skill name
        const res = await fetch(`${BASE_URL}/skills/master/${masterForm.skill_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ skill_name: name }),
        });
        if (!res.ok) throw new Error("Failed to update master skill");

        // 2. Add new sub-skills (if any)
        const filteredNew = newSubSkills.filter((s) => s.subskill_name.trim() !== "");
        if (filteredNew.length > 0) {
          const resSub = await fetch(`${BASE_URL}/skills/sub/bulk/${masterForm.skill_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ 
              new_subskills: filteredNew.map((s) => ({
                subskill_name: s.subskill_name, 
              })),
            }),
          });
          const data = await res.json();
          if (!resSub.ok) throw new Error("Failed to add new sub-skills");
          setSuccessMessage(data.message || "Master skill updated successfully");
        }
      }

      // reset + refresh
      setShowForm(false);
      setMasterForm({});
      setSubForm({});
      setSubSkillsInForm([{ subskill_name: "" }]);
      setIsAddingMasterSkill(false);
      setIsEditingSub(false);
      fetchMasterSkills();
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong.");
    }
  };

  const addSubSkillField = () => setSubSkillsInForm([...subSkillsInForm, { subskill_name: "" }]);
  const removeSubSkillField = (index: number) => setSubSkillsInForm(subSkillsInForm.filter((_, i) => i !== index));
  const updateSubSkillName = (index: number, name: string) => {
    const newSubSkills = [...subSkillsInForm];
    newSubSkills[index].subskill_name = name;
    setSubSkillsInForm(newSubSkills);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="      Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2 py-1 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
          />
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
          onClick={() => {
            setShowForm(true);
            setIsAddingMasterSkill(true);
            setIsEditingSub(false);
            setMasterForm({});
            setSubSkillsInForm([{ subskill_name: "" }]);
            setNewSubSkills([{ subskill_name: "" }]);
          }}
        >
          <div className="flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Master Skill
          </div>
        </button>
      </div>

      {successMessage && <p className="p-3 mb-4 bg-green-100 text-green-700 rounded-lg text-sm font-medium">{successMessage}</p>}
      {errorMessage && <p className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium">{errorMessage}</p>}

      {loading ? (
        <p className="text-center text-gray-600">Loading skills...</p>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600 w-3/5">Master Skill</th>
                  <th className="px-4 py-2 text-right text-gray-600 w-2/5">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedMasterSkills.map((master) => (
                  <>
                    <tr key={master.skill_id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-4 py-2 text-gray-800 font-semibold" onClick={() => toggleExpanded(master.skill_id)}>
                        <div className="flex items-center gap-2">
                          {expandedSkills.has(master.skill_id) ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                          {master.skill_name}
                        </div>
                      </td>
                      <td className="px-4 py-2 flex justify-end gap-2 items-center">
                        <button
                          className="px-3 py-1 bg-white text-blue-600 rounded-full border border-blue-600 text-xs font-medium flex items-center gap-1 hover:bg-blue-50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMasterForm(master);
                            setIsAddingMasterSkill(false);
                            setIsEditingSub(false);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                        <button
                          className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-medium flex items-center gap-1 hover:bg-red-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick('master', master.skill_id, master.skill_name);
                          }}
                        >
                          <Trash className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>
                    {expandedSkills.has(master.skill_id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={2} className="p-0">
                          <div className="p-4 border-t border-gray-200">
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Sub-skills</h4>
                            <table className="min-w-full text-xs divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left text-gray-600 w-3/5">Subskill Name</th>
                                  <th className="px-4 py-2 text-right text-gray-600 w-2/5">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {master.subskills.map((sub) => (
                                  <tr key={sub.subskill_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2 text-gray-800">{sub.subskill_name}</td>
                                    <td className="px-4 py-2 flex justify-end gap-2">
                                      <button
                                        className="px-3 py-1 bg-white text-blue-600 rounded-full border border-blue-600 text-xs font-medium flex items-center gap-1 hover:bg-blue-50 transition-colors"
                                        onClick={() => {
                                          setSubForm(sub);
                                          setIsEditingSub(true);
                                          setIsAddingMasterSkill(false);
                                          setShowForm(true);
                                        }}
                                      >
                                        <Edit className="w-3 h-3" /> Edit
                                      </button>
                                      <button
                                        className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-medium flex items-center gap-1 hover:bg-red-700 transition-colors"
                                        onClick={() => handleDeleteClick('subskill', sub.subskill_id, sub.subskill_name)}
                                      >
                                        <Trash className="w-3 h-3" /> Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-center items-center mt-6 space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 bg-gray-200 rounded-full text-sm disabled:opacity-50 hover:bg-gray-300"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 bg-gray-200 rounded-full text-sm disabled:opacity-50 hover:bg-gray-300"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Modal for adding/editing skills */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {isAddingMasterSkill ? "Add Master Skill" : isEditingSub ? "Edit Sub Skill" : "Edit Master Skill"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isAddingMasterSkill && (
              <>
                <input
                  type="text"
                  placeholder="Master Skill Name"
                  value={masterForm.skill_name || ""}
                  onChange={(e) => setMasterForm({ ...masterForm, skill_name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg w-full mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {subSkillsInForm.map((sub, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder={`Sub-skill ${i + 1}`}
                      value={sub.subskill_name}
                      onChange={(e) => updateSubSkillName(i, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {subSkillsInForm.length > 1 && (
                      <button onClick={() => removeSubSkillField(i)} className="p-2 text-red-500 rounded-full hover:bg-red-100 transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addSubSkillField} className="mt-2 text-sm text-blue-600 flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4" /> Add Sub-skill
                </button>
              </>
            )}

            {!isAddingMasterSkill && !isEditingSub && (
              <>
                <input
                  type="text"
                  placeholder="Master Skill Name"
                  value={masterForm.skill_name || ""}
                  onChange={(e) => setMasterForm({ ...masterForm, skill_name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg w-full mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <h4 className="text-sm font-medium text-gray-700 mb-2">Add New Sub-skills</h4>
                {newSubSkills.map((sub, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder={`Sub-skill ${i + 1}`}
                      value={sub.subskill_name}
                      onChange={(e) => {
                        const updated = [...newSubSkills];
                        updated[i].subskill_name = e.target.value;
                        setNewSubSkills(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {newSubSkills.length > 1 && (
                      <button
                        onClick={() => setNewSubSkills(newSubSkills.filter((_, idx) => idx !== i))}
                        className="p-2 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setNewSubSkills([...newSubSkills, { subskill_name: "" }])}
                  className="mt-2 text-sm text-blue-600 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add Sub-skill
                </button>
              </>
            )}

            {isEditingSub && (
              <input
                type="text"
                placeholder="Sub Skill Name"
                value={subForm.subskill_name || ""}
                onChange={(e) => setSubForm({ ...subForm, subskill_name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to delete **{itemToDelete?.name}**? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
