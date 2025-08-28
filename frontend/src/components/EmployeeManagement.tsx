import { useState, useEffect } from "react";

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

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [form, setForm] = useState<Partial<Employee>>({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false); // controls modal

  const token = localStorage.getItem("token");

  const fetchEmployees = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        page_size: String(pageSize),
      });
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      setEmployees(data.results || data);
      setTotalPages(data.total_pages || Math.ceil(data.length / pageSize));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, search]);

  const handleAddOrUpdate = async () => {
  if (!token) return;
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
      ? `${import.meta.env.VITE_BACKEND_URL}/users/${form.id}`
      : `${import.meta.env.VITE_BACKEND_URL}/users`;

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

  const handleToggleActive = async (emp_id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/${emp_id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to toggle active status");
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Employee Management</h2>

      {/* Search & Add Button */}
      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
        <input
          type="text"
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full md:w-1/3 px-2 py-1 border rounded text-sm"
        />
        <button
          onClick={() => { setShowForm(true); setForm({}); }}
          className="px-4 py-1 bg-blue-600 text-white rounded text-sm"
        >
          Add Employee
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">{form.id ? "Edit Employee" : "Add Employee"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                placeholder="Employee ID"
                value={form.emp_id || ""}
                onChange={(e) => setForm({ ...form, emp_id: e.target.value })}
                className="px-2 py-1 border rounded text-sm"
              />
              <input
                placeholder="Name"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-2 py-1 border rounded text-sm"
              />
              <input
                placeholder="Email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-2 py-1 border rounded text-sm"
              />
              <input
                placeholder="Designation"
                value={form.designation || ""}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="px-2 py-1 border rounded text-sm"
              />
              <input
                placeholder="Capability"
                value={form.capability || ""}
                onChange={(e) => setForm({ ...form, capability: e.target.value })}
                className="px-2 py-1 border rounded text-sm"
              />
              <select
                value={form.approver_id || ""}
                onChange={(e) => setForm({ ...form, approver_id: Number(e.target.value) })}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="">Select Approver</option>
                {employees.filter(emp => emp.is_approver).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_approver || false}
                  onChange={(e) => setForm({ ...form, is_approver: e.target.checked })}
                />
                Is Approver
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_available ?? true}
                  onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                />
                Is Available
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1 bg-gray-200 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrUpdate}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                {form.id ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1">Emp ID</th>
              <th className="px-2 py-1">Name</th>
              <th className="px-2 py-1">Email</th>
              <th className="px-2 py-1">Designation</th>
              <th className="px-2 py-1">Capability</th>
              <th className="px-2 py-1">Approver</th>
              <th className="px-2 py-1">Active</th>
              <th className="px-2 py-1">Available</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map(emp => (
              <tr key={emp.id}>
                <td className="px-2 py-1">{emp.emp_id}</td>
                <td className="px-2 py-1">{emp.name}</td>
                <td className="px-2 py-1">{emp.email}</td>
                <td className="px-2 py-1">{emp.designation}</td>
                <td className="px-2 py-1">{emp.capability}</td>
                <td className="px-2 py-1">{employees.find(e => e.id === emp.approver_id)?.name || "-"}</td>
                <td className="px-2 py-1">{emp.is_active ? "Active" : "Inactive"}</td>
                <td className="px-2 py-1">{emp.is_available ? "Yes" : "No"}</td>
                <td className="px-2 py-1 flex gap-1">
                  <button
                    className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                    onClick={() => { setForm(emp); setShowForm(true); }}
                  >
                    Edit
                  </button>
                  <button
                    className={`px-2 py-1 rounded text-white text-xs ${emp.is_active ? "bg-red-500" : "bg-green-500"}`}
                    onClick={() => handleToggleActive(emp.id.toString())}
                  >
                    {emp.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center px-5 py-3 border-t border-gray-200 bg-gray-50 mt-3">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-sm"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}
