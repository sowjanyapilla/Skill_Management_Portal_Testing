import { useState, useEffect } from "react";
import { Edit, UserPlus, X, Search, Check, Ban } from "lucide-react";

interface Employee {
  id: number;
  emp_id: string;
  name: string;
  email: string;
  designation?: string;
  capability?: string;
  is_approver: boolean;
  approver_id?: number;
  is_active: boolean;
  is_available: boolean;
}

interface ApproverCandidate {
  id: number;
  name: string;
  is_approver: boolean;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [form, setForm] = useState<Partial<Employee>>({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [approverSearch, setApproverSearch] = useState("");
  const [approverSuggestions, setApproverSuggestions] = useState<ApproverCandidate[]>([]);
  const [approverCandidates, setApproverCandidates] = useState<ApproverCandidate[]>([]);
  const [formError, setFormError] = useState("");


  // Use this in a real app, not a hardcoded URL
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

  // Fetch paginated employees for the main table
  const fetchEmployees = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        page_size: String(pageSize),
      });
      const res = await fetch(`${BASE_URL}/users/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      setEmployees(data.results || data);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all employees for the approver search bar once
  const fetchApproverCandidates = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/users/approvers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch approver candidates");
      const data = await res.json();
      setApproverCandidates(data);
    } catch (err) {
      console.error("Error fetching all employees:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, search]);

  useEffect(() => {
    fetchApproverCandidates();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior

    if (!token) return;
    // Client-side validation
    if (!form.emp_id || !form.name || !form.email) {
      setFormError("Employee ID, Name, and Email are required fields.");
      return;
    }
    setFormError("");

    try {
      const payload = {
        ...form,
        designation: form.designation?.trim() || null,
        capability: form.capability?.trim() || null,
        approver_id: form.approver_id || null,
        is_approver: form.is_approver || false,
        is_available: form.is_available ?? true,
        is_active: form.is_active ?? true,
      };

      const method = form.id ? "PUT" : "POST";
      const url = form.id
        ? `${BASE_URL}/users/${form.id}`
        : `${BASE_URL}/users`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add/update employee");

      setForm({});
      setShowForm(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/users/${id}/toggle-active-status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to toggle active status");
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproverSearch = (query: string) => {
    setApproverSearch(query);
    if (query.length > 1) {
      const filtered = approverCandidates.filter(emp =>
        emp.name.toLowerCase().includes(query.toLowerCase())
      );
      setApproverSuggestions(filtered);
    } else {
      setApproverSuggestions([]);
    }
  };

  const handleSelectApprover = (approver: ApproverCandidate) => {
    setForm({ ...form, approver_id: approver.id });
    setApproverSearch(approver.name);
    setApproverSuggestions([]);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="      Search by name or ID"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-2 py-1 border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
          />
        </div>


        <button
          onClick={() => { setShowForm(true); setForm({}); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{form.id ? "Edit Employee" : "Add Employee"}</h3>
            <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Employee ID"
                value={form.emp_id || ""}
                onChange={(e) => setForm({ ...form, emp_id: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                placeholder="Name"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                placeholder="Designation"
                value={form.designation || ""}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                placeholder="Capability"
                value={form.capability || ""}
                onChange={(e) => setForm({ ...form, capability: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Select Approver"
                  value={approverSearch}
                  onChange={(e) => handleApproverSearch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {approverSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {approverSuggestions.map(emp => (
                      <li
                        key={emp.id}
                        onClick={() => handleSelectApprover(emp)}
                        className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                      >
                        {emp.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="col-span-1 md:col-span-2 flex items-center gap-4">
                
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_available ?? true}
                    onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Is Available
                </label>
              </div>

              {formError && (
                <p className="mt-4 text-sm text-red-600 font-medium col-span-1 md:col-span-2">{formError}</p>
              )}
            
              <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {form.id ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Table */}
      {loading ? (
        <p className="text-center text-gray-600">Loading employees...</p>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-gray-600">Emp ID</th>
                <th className="px-4 py-2 text-left text-gray-600">Name</th>
                <th className="px-4 py-2 text-left text-gray-600">Email</th>
                <th className="px-4 py-2 text-left text-gray-600">Designation</th>
                <th className="px-4 py-2 text-left text-gray-600">Capability</th>
                <th className="px-4 py-2 text-left text-gray-600">Approver</th>
                <th className="px-4 py-2 text-left text-gray-600">Status</th>
                <th className="px-4 py-2 text-left text-gray-600">Availability</th>
                <th className="px-4 py-2 text-right text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-gray-800">{emp.emp_id}</td>
                  <td className="px-4 py-2 text-gray-800">{emp.name}</td>
                  <td className="px-4 py-2 text-gray-800">{emp.email}</td>
                  <td className="px-4 py-2 text-gray-800">{emp.designation || "-"}</td>
                  <td className="px-4 py-2 text-gray-800">{emp.capability || "-"}</td>
                  <td className="px-4 py-2 text-gray-800">{approverCandidates.find(e => e.id === emp.approver_id)?.name || "-"}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {emp.is_available ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex justify-end gap-2 items-center">
                    <button
                      className="px-3 py-1 bg-white text-blue-600 rounded-full border border-blue-600 text-xs font-medium flex items-center gap-1 hover:bg-blue-50 transition-colors"
                      onClick={() => { setForm(emp); setShowForm(true); }}
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    <button
                      className={`px-3 py-1 rounded-full text-white text-xs font-medium flex items-center gap-1 transition-colors ${emp.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                      onClick={() => handleToggleActive(emp.id)}
                    >
                      {emp.is_active ? <Ban className="w-3 h-3" /> : <Check className="w-3 h-3" />} {emp.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center mt-6 space-x-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => Number(p) - 1)}
          className="px-4 py-2 bg-gray-200 rounded-full text-sm disabled:opacity-50 hover:bg-gray-300"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(p => Number(p) + 1)}
          className="px-4 py-2 bg-gray-200 rounded-full text-sm disabled:opacity-50 hover:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
