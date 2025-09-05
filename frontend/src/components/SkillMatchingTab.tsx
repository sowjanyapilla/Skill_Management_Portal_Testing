import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Star, X } from "lucide-react";

// Import the modals and their types from the shared component file
import { MasterSkillModal, SubskillModal, MasterSkillMetrics, SubskillMetrics } from '../components/SkillModals';

type User = any;

interface SkillMatchingTabProps {
    user?: User;
}

interface SubSkillOption {
    id: number;
    name: string;
    master_skill?: string;
}

interface SubSkillRequirement {
    subskill_id: number;
    min_proficiency?: number | null;
    min_experience?: number | null;
    max_experience?: number | null;
    require_certification?: boolean | null;
}

interface SubskillData {
    name: string;
    proficiency?: number | null;
    experience?: number | null;
    hasCertification?: boolean;
    status?: string;
    certificationFile?: string | null;
    certificationCreationDate?: string | null;
    certificationExpirationDate?: string | null;
    employee_name?: string;
    employee_id?: string;
    skill_name?: string;
    coverage?: number;
    score?: number;
    subskill_id?: number;
}

interface SkillData {
    skill_name: string;
    matched_subskills: number;
    total_subskills: number;
    sub_skills: SubskillData[];
}

interface EmployeeData {
    employee_id: string;
    employee_name: string;
    score: number;
    coverage: number;
    skills: SkillData[];
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function SkillMatchingTab(_: SkillMatchingTabProps) {
    // data/state
    const [allSubskills, setAllSubskills] = useState<SubSkillOption[]>([]);
    const [searchInput, setSearchInput] = useState("");
    const [suggestions, setSuggestions] = useState<SubSkillOption[]>([]);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [selectedRequirements, setSelectedRequirements] = useState<
        SubSkillRequirement[]
    >([]);
    const [unmatchedCandidates, setUnmatchedCandidates] = useState<
        { phrase: string; skill?: string }[]
    >([]);

    const [jobTitle, setJobTitle] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize] = useState(5); // employees per page
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<EmployeeData[]>([]);

    // New: Modal State for SkillMatchingTab
    const [masterSkillModalData, setMasterSkillModalData] = useState<MasterSkillMetrics | null>(null);
    const [subskillModalData, setSubskillModalData] = useState<SubskillMetrics | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    // header filters (table-level)
    const [headerCertFilter, setHeaderCertFilter] = useState<"" | "true" | "false">("");
    const [headerStatusFilter, setHeaderStatusFilter] = useState<"" | string>("");

    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // fetch subskills list once
    useEffect(() => {
        const fetchSubskills = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/skills/subskills`
                );
                if (!res.ok) throw new Error("Failed to load subskills");
                const json = await res.json();
                setAllSubskills(json || []);
            } catch (err) {
                console.error("Failed to load subskills", err);
            }
        };
        fetchSubskills();
    }, []);

    // default search on mount (no requirements) — shows initial results
    useEffect(() => {
        const t = setTimeout(() => fetchResults(1), 120);
        return () => clearTimeout(t);
    }, []);

    // suggestions (debounced) — match master_skill + subskill name
    useEffect(() => {
        if (!searchInput) {
            setSuggestions([]);
            setIsSuggestionsOpen(false);
            return;
        }
        const t = setTimeout(() => {
            const q = searchInput.trim().toLowerCase();
            const filtered = allSubskills.filter((s) => {
                const combined = `${(s.master_skill ?? "")} ${s.name}`.toLowerCase();
                return combined.includes(q);
            });
            setSuggestions(filtered.slice(0, 7));
            setIsSuggestionsOpen(true);
        }, 120);
        return () => clearTimeout(t);
    }, [searchInput, allSubskills]);

    // click outside closes suggestions
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsSuggestionsOpen(false);
            }
        };
        document.addEventListener("click", onDoc);
        return () => document.removeEventListener("click", onDoc);
    }, []);

    // add selected subskill
    const addRequirement = (sub: SubSkillOption) => {
        if (!selectedRequirements.some((r) => r.subskill_id === sub.id)) {
            setSelectedRequirements((prev) => [
                ...prev,
                {
                    subskill_id: Number(sub.id),
                    min_proficiency: null,
                    min_experience: null,
                    max_experience: null,
                    require_certification: null,
                },
            ]);
        }
        setSearchInput("");
        setSuggestions([]);
        setIsSuggestionsOpen(false);
        inputRef.current?.focus();
    };

    const removeRequirement = (id: number) => {
        setSelectedRequirements((reqs) => reqs.filter((r) => r.subskill_id !== id));
    };

    // update requirement field (keeps values compact)
    const updateRequirement = (
        id: number,
        field: keyof SubSkillRequirement,
        value: any
    ) => {
        setSelectedRequirements((reqs) =>
            reqs.map((r) =>
                r.subskill_id === id
                    ? {
                        ...r,
                        [field]:
                            value === "" || value === null || value === undefined
                                ? null
                                : field === "require_certification"
                                    ? Boolean(value)
                                    : Number(value),
                    }
                    : r
            )
        );
    };

    const expOptions = [...Array(10)].map((_, i) => i + 1);

    const buildPayload = () => {
        return {
            requirements: selectedRequirements.map((r) => {
                const out: any = { subskill_id: Number(r.subskill_id) };
                if (r.min_proficiency != null) out.min_proficiency = Number(r.min_proficiency);
                if (r.min_experience != null) out.min_experience = Number(r.min_experience) * 12;
                if (r.max_experience != null) out.max_experience = Number(r.max_experience) * 12;
                if (r.require_certification != null)
                    out.require_certification = Boolean(r.require_certification);
                return out;
            }),
        };
    };

    const fetchResults = async (pageToUse = page) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const payload = buildPayload();
            console.debug("POST payload:", payload);

            const url = `${import.meta.env.VITE_BACKEND_URL}/skills/matching?page=${pageToUse}&page_size=${pageSize}`;

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const txt = await res.text();
                console.error("Server responded", res.status, txt);
                throw new Error(txt || "Server error");
            }

            const json = await res.json();
            setResults(json.results || []);
            setTotalPages(json.total_pages || 1);
            setPage(json.page || pageToUse);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMasterSkillView = async (skillName: string) => {
        setModalLoading(true);
        setMasterSkillModalData(null);
        try {
            const token = localStorage.getItem("token");
            const url = `${BACKEND_URL}/dashboard/master-skill-by-name?skill_name=${encodeURIComponent(skillName)}`;
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error("Failed to fetch master skill data.");
            const data = await res.json();
            setMasterSkillModalData(data);
        } catch (err) {
            console.error(err);
            alert("Failed to load skill details.");
        } finally {
            setModalLoading(false);
        }
    };

    const handleSubskillView = async (subskillId: number) => {
        setModalLoading(true);
        setSubskillModalData(null);
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

    const handleSearch = () => {
        setPage(1);
        fetchResults(1);
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem("token");
            const payload = buildPayload();
            const url = `${import.meta.env.VITE_BACKEND_URL}/skills/matching/export`;
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const href = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = href;
            a.download = "employee_skills.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(href);
        } catch (err) {
            console.error("Export error:", err);
        }
    };

    const handleFileUpload = async (file?: File) => {
        if (!file) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const fd = new FormData();
            fd.append("file", file);

            const url = `${import.meta.env.VITE_BACKEND_URL}/skills/upload_jd`;
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: fd,
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Upload failed: ${res.status} ${txt}`);
            }

            const json = await res.json();
            setJobTitle(json.job_title);
            const structured = Array.isArray(json.structured_data) ? json.structured_data : [];
            const unmatched = Array.isArray(json.unmatched_skills) ? json.unmatched_skills : [];

            const newSelected: SubSkillRequirement[] = [];
            const newUnmatched: { phrase: string; skill?: string }[] = [];

            const findSubskillCandidate = (subSkillName: string, skillName?: string) => {
                if (!subSkillName) return { found: undefined, ambiguous: false, candidates: [] };
                const sLower = subSkillName.trim().toLowerCase();
                const skillLower = (skillName ?? "").trim().toLowerCase();
                const exactMatches = allSubskills.filter(s => s.name.trim().toLowerCase() === sLower);
                if (exactMatches.length === 1) return { found: exactMatches[0], ambiguous: false, candidates: exactMatches };
                if (exactMatches.length > 1 && skillName) {
                    const masterMatches = exactMatches.filter(s => (s.master_skill ?? "").trim().toLowerCase() === skillLower);
                    if (masterMatches.length === 1) return { found: masterMatches[0], ambiguous: false, candidates: masterMatches };
                    if (masterMatches.length > 1) return { found: masterMatches[0], ambiguous: true, candidates: masterMatches };
                    const masterContains = exactMatches.filter(s => (s.master_skill ?? "").trim().toLowerCase().includes(skillLower) || skillLower.includes((s.master_skill ?? "").trim().toLowerCase()));
                    if (masterContains.length === 1) return { found: masterContains[0], ambiguous: false, candidates: masterContains };
                    if (masterContains.length > 1) return { found: masterContains[0], ambiguous: true, candidates: masterContains };
                }
                const substrMatches = allSubskills.filter(s => {
                    const combined = `${(s.master_skill ?? "")} ${(s.name ?? "")}`.trim().toLowerCase();
                    return s.name.trim().toLowerCase().includes(sLower) || sLower.includes(s.name.trim().toLowerCase()) || combined.includes(sLower);
                });
                if (substrMatches.length === 1) return { found: substrMatches[0], ambiguous: false, candidates: substrMatches };
                if (substrMatches.length > 1 && skillName) {
                    const preferByMaster = substrMatches.filter(s => (s.master_skill ?? "").trim().toLowerCase() === skillLower);
                    if (preferByMaster.length === 1) return { found: preferByMaster[0], ambiguous: false, candidates: preferByMaster };
                    if (preferByMaster.length > 1) return { found: preferByMaster[0], ambiguous: true, candidates: preferByMaster };
                    const preferContains = substrMatches.filter(s => (s.master_skill ?? "").trim().toLowerCase().includes(skillLower) || skillLower.includes((s.master_skill ?? "").trim().toLowerCase()));
                    if (preferContains.length === 1) return { found: preferContains[0], ambiguous: false, candidates: preferContains };
                    if (preferContains.length > 1) return { found: preferContains[0], ambiguous: true, candidates: preferContains };
                }
                if (exactMatches.length > 0) return { found: exactMatches[0], ambiguous: exactMatches.length > 1, candidates: exactMatches };
                if (substrMatches.length > 0) return { found: substrMatches[0], ambiguous: substrMatches.length > 1, candidates: substrMatches };
                return { found: undefined, ambiguous: false, candidates: [] };
            };

            for (const item of structured) {
                const skillFromLLM = (item.skill ?? "").toString();
                const subFromLLM = (item.sub_skill ?? "").toString();
                const { found, ambiguous, candidates } = findSubskillCandidate(subFromLLM, skillFromLLM);
                if (found) {
                    const parseExp = (v: any) => {
                        if (v == null) return null;
                        if (typeof v === "string" && v.trim().endsWith("+")) {
                            const num = parseFloat(v.replace("+", "").trim());
                            return Number.isFinite(num) ? 11 : null;
                        }
                        const n = Number(v);
                        return Number.isFinite(n) ? n : null;
                    };
                    newSelected.push({
                        subskill_id: Number(found.id),
                        min_proficiency: item.min_proficiency == null ? null : Number(item.min_proficiency),
                        min_experience: parseExp(item.min_experience),
                        max_experience: parseExp(item.max_experience),
                        require_certification: item.required_certification == null ? null : Boolean(item.required_certification),
                    });
                    if (ambiguous) {
                        newUnmatched.push({
                            phrase: subFromLLM || skillFromLLM || "Unknown",
                            skill: skillFromLLM || undefined,
                            ambiguous: true,
                            candidates: candidates.map(c => ({ id: c.id, name: c.name, master_skill: c.master_skill }))
                        });
                    }
                } else {
                    newUnmatched.push({
                        phrase: subFromLLM || skillFromLLM || "Unknown",
                        skill: skillFromLLM || undefined
                    });
                }
            }
            for (const u of unmatched) {
                if (typeof u === "string") {
                    newUnmatched.push({ phrase: u });
                } else if (u && typeof u === "object") {
                    newUnmatched.push({ phrase: (u.sub_skill ?? u.phrase ?? ""), skill: u.skill ?? undefined });
                }
            }
            setSelectedRequirements(() => [...newSelected]);
            setUnmatchedCandidates(() => {
                const map = new Map<string, { id?: number; phrase: string; skill?: string }>();
                newUnmatched.forEach(u => {
                    const key = `${u.skill ?? ""}||${u.phrase}`.toLowerCase();
                    if (!map.has(key)) map.set(key, u);
                });
                return Array.from(map.values());
            });
            setIsSuggestionsOpen(false);
        } catch (err) {
            console.error("File parsing/upload error:", err);
            alert(`Upload failed: ${String(err)}`);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
            setLoading(false);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        handleFileUpload(f);
    };

    const flattenedSubSkills: SubskillData[] = useMemo(() => {
        return results.flatMap((emp) =>
            emp.skills.flatMap((skill) =>
                skill.sub_skills.map((sub) => ({
                    ...sub,
                    employee_name: emp.employee_name,
                    employee_id: emp.employee_id,
                    skill_name: skill.skill_name,
                    coverage: emp.coverage,
                    score: emp.score,
                    subskill_id: sub.subskill_id,
                }))
            )
        );
    }, [results]);

    const filteredSubSkills = useMemo(() => {
        let arr = [...flattenedSubSkills];
        if (headerCertFilter !== "") {
            const want = headerCertFilter === "true";
            arr = arr.filter(s => Boolean(s.hasCertification) === want);
        }
        if (headerStatusFilter) {
            arr = arr.filter(s => (s.status || "").toLowerCase() === headerStatusFilter.toLowerCase());
        }
        return arr;
    }, [flattenedSubSkills, headerCertFilter, headerStatusFilter]);

    const groupedByEmployee = useMemo(() => {
        const map: Record<string, EmployeeData> = {};
        filteredSubSkills.forEach((sub) => {
            const empId = sub.employee_id ?? "unknown";
            if (!map[empId]) {
                map[empId] = {
                    employee_id: sub.employee_id || empId,
                    employee_name: sub.employee_name || "Unknown",
                    score: sub.score ?? 0,
                    coverage: sub.coverage ?? 0,
                    skills: [],
                };
            }
            let skillObj = map[empId].skills.find((s) => s.skill_name === sub.skill_name);
            if (!skillObj) {
                skillObj = {
                    skill_name: sub.skill_name || "Unknown",
                    matched_subskills: 0,
                    total_subskills: 0,
                    sub_skills: [],
                };
                map[empId].skills.push(skillObj);
            }
            skillObj.sub_skills.push(sub);
            skillObj.total_subskills++;
            if ((sub.proficiency ?? 0) > 0) skillObj.matched_subskills++;
        });
        return Object.values(map);
    }, [filteredSubSkills]);

    const getEmployeeRowSpan = (emp: EmployeeData) =>
        emp.skills.reduce((acc, s) => acc + Math.max(1, s.sub_skills.length), 0);

    const renderStars = (proficiency?: number | null) => {
        const p = proficiency ?? 0;
        return (
            <div className="flex items-center space-x-1">
                {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                        key={i}
                        className={`w-3 h-3 ${i < p ? "text-yellow-400" : "text-gray-300"}`}
                    />
                ))}
                <span className="text-xs text-gray-600 ml-1">({p}/5)</span>
            </div>
        );
    };

    return (
        <div className="p-4">
            {/* Compact add-subskill UI */}
            <div className="bg-white p-2 rounded shadow-sm mb-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1" ref={containerRef}>
                        <div className="flex items-center gap-2">
                            <Search className="absolute left-2 top-2 text-gray-400 w-4 h-4" />
                            <input
                                ref={inputRef}
                                className="w-full pl-8 pr-2 py-1 text-sm border rounded"
                                placeholder="Search skill/subskills..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <button
                                className="text-sm px-2 py-0.5 bg-gray-100 rounded"
                                onClick={() => {
                                    setSearchInput("");
                                    setIsSuggestionsOpen(false);
                                }}
                                title="Clear"
                            >
                                Clear
                            </button>
                        </div>
                        {isSuggestionsOpen && suggestions.length > 0 && (
                            <ul className="absolute left-0 right-0 z-50 bg-white border rounded mt-1 max-h-36 overflow-auto shadow-sm text-sm">
                                {suggestions.map((s) => (
                                    <li
                                        key={s.id}
                                        onClick={() => addRequirement(s)}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <span className="font-medium">{s.master_skill ?? "—"}</span>
                                        <span className="text-gray-600"> — {s.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSearch}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                        >
                            {loading ? "Searching..." : "Search"}
                        </button>
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,.txt"
                                onChange={onFileChange}
                                className="text-xs"
                                id="jd-upload"
                                style={{ display: "none" }}
                            />
                            <label htmlFor="jd-upload" className="px-3 py-1 bg-indigo-600 text-white rounded text-sm cursor-pointer">
                                Upload JD
                            </label>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedRequirements([]);
                                setJobTitle("");
                                setResults([]);
                                setPage(1);
                                setUnmatchedCandidates([]);
                            }}
                            className="px-3 py-1 bg-gray-100 rounded text-sm"
                        >
                            Clear All Filters
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                        >
                            Export
                        </button>
                    </div>
                </div>
  
                <div className="mt-2 space-y-2">
                    <div
                      className="text-2xl md:text-xl font-bold text-gray-900 leading-tight"
                      aria-label={`Job title: ${jobTitle}`}
                    >
                    {jobTitle}
                    </div>
                    {unmatchedCandidates.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-1">
                            {unmatchedCandidates.map((u, idx) => (
                                <div key={idx} className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">
                                    Not found: <strong>{u.phrase}</strong>{u.skill ? ` (skill: ${u.skill})` : ""}
                                </div>
                            ))}
                        </div>
                    )}
                    {selectedRequirements.map((req) => {
                        const sub = allSubskills.find((s) => s.id === req.subskill_id);
                        const displayLabel = sub ? `${sub.master_skill ?? "—"} - ${sub.name}` : `Subskill ${req.subskill_id}`;
                        return (
                            <div
                                key={req.subskill_id}
                                className="w-full bg-gray-50 border rounded p-1 grid grid-cols-12 gap-2 items-center text-sm"
                            >
                                <div className="col-span-3 font-medium text-sm truncate">{displayLabel}</div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <label className="text-xs text-gray-600 w-14">Min Prof</label>
                                    <select
                                        className="w-full px-2 py-0.5 text-sm border rounded"
                                        value={req.min_proficiency == null ? "" : String(req.min_proficiency)}
                                        onChange={(e) => {
                                            const v = e.target.value === "" ? null : Number(e.target.value);
                                            updateRequirement(req.subskill_id, "min_proficiency", v);
                                        }}
                                    >
                                        <option value="">Any</option>
                                        {[1, 2, 3, 4, 5].map((o) => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <label className="text-xs text-gray-600 w-14">Min Exp</label>
                                    <select
                                        className="w-full px-2 py-0.5 text-sm border rounded"
                                        value={req.min_experience == null ? "" : String(req.min_experience === 11 ? 11 : req.min_experience)}
                                        onChange={(e) => {
                                            const v = e.target.value === "" ? null : (e.target.value === "11" ? 11 : Number(e.target.value));
                                            updateRequirement(req.subskill_id, "min_experience", v);
                                        }}
                                    >
                                        <option value="">Any</option>
                                        {expOptions.map((o) => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                        <option value="11">10+</option>
                                    </select>
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
                                    <label className="text-xs text-gray-600 w-14">Max Exp</label>
                                    <select
                                        className="w-full px-2 py-0.5 text-sm border rounded"
                                        value={req.max_experience == null ? "" : String(req.max_experience === 11 ? 11 : req.max_experience)}
                                        onChange={(e) => {
                                            const v = e.target.value === "" ? null : (e.target.value === "11" ? 11 : Number(e.target.value));
                                            updateRequirement(req.subskill_id, "max_experience", v);
                                        }}
                                    >
                                        <option value="">Any</option>
                                        {expOptions.map((o) => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                        <option value="11">10+</option>
                                    </select>
                                </div>
                                <div className="col-span-1 flex items-center gap-1">
                                    <label className="text-xs text-gray-600 w-20">Certification</label>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(req.require_certification)}
                                        onChange={(e) =>
                                            updateRequirement(req.subskill_id, "require_certification", e.target.checked)
                                        }
                                    />
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => sub && sub.id && handleSubskillView(sub.id)}
                                        title="View Charts"
                                        className="px-2 py-0.5 text-xs text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                                    >
                                        Charts           
                                    </button>
                                    <button
                                        onClick={() => removeRequirement(req.subskill_id)}
                                        title="Remove"
                                        className="text-red-600 hover:bg-red-100 rounded-full p-1"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Results table (grouped by employee -> skill -> subskills) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto">
                <div className="px-4 py-3 border-b">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Matching Sub-skills</h3>
                        <div className="text-xs text-gray-600">Page {page} of {totalPages}</div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold">Employee Name</th>
                                <th className="px-3 py-2 text-left font-semibold">Employee Id</th>
                                <th className="px-3 py-2 text-left font-semibold">Skill</th>
                                <th className="px-3 py-2 text-left font-semibold">Sub-skill</th>
                                <th className="px-3 py-2 text-left font-semibold">Proficiency</th>
                                <th className="px-3 py-2 text-left font-semibold">Experience</th>
                                <th className="px-3 py-2 text-left font-semibold ">
                                    <div className="flex items-center gap-2">
                                        <span>Certification</span>
                                        <select
                                            className="mt-1 w-5 px-1 py-0.5 border border-gray-300 rounded text-xs"
                                            value={headerCertFilter}
                                            onChange={(e) => setHeaderCertFilter(e.target.value as "" | "true" | "false")}
                                        >
                                            <option value="">All</option>
                                            <option value="true">Required</option>
                                            <option value="false">Not Required</option>
                                        </select>
                                    </div>
                                </th>
                                <th className="px-3 py-2 text-left font-semibold">
                                    <div className="flex items-center gap-2">
                                        <span>Status</span>
                                        <select
                                            className="mt-1 w-5 px-1 py-0.5 border border-gray-300 rounded text-xs"
                                            value={headerStatusFilter}
                                            onChange={(e) => setHeaderStatusFilter(e.target.value)}
                                        >
                                            <option value="">All</option>
                                            <option value="APPROVED">APPROVED</option>
                                            <option value="PENDING">PENDING</option>
                                            <option value="REJECTED">REJECTED</option>
                                        </select>
                                    </div>
                                </th>
                                <th className="px-3 py-2 text-left font-semibold">Score / Coverage</th>
                               
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">
                            {groupedByEmployee.map((emp) =>
                                emp.skills.flatMap((skill, skillIndex) => {
                                    const subSkills = skill.sub_skills.length
                                        ? skill.sub_skills
                                        : [
                                            {
                                                name: "-",
                                                proficiency: 0,
                                                experience: 0,
                                                hasCertification: false,
                                                status: "-",
                                            },
                                        ];

                                    return subSkills.map((sub, idx) => {
                                        const showEmployeeCell = idx === 0 && skillIndex === 0;
                                        const employeeRowSpan = getEmployeeRowSpan(emp);
                                        return (
                                            <tr
                                                key={`${emp.employee_id}-${skill.skill_name}-${idx}`}
                                                className="text-xs even:bg-white odd:bg-white"
                                            >
                                                {showEmployeeCell && (
                                                    <>
                                                        <td
                                                            rowSpan={employeeRowSpan}
                                                            className="px-3 py-1 text-xs font-medium align-top"
                                                        >
                                                            {emp.employee_name}
                                                        </td>
                                                        <td
                                                            rowSpan={employeeRowSpan}
                                                            className="px-3 py-1 text-xs align-top"
                                                        >
                                                            {emp.employee_id}
                                                        </td>
                                                    </>
                                                )}

                                                {idx === 0 && (
                                                    <td
                                                        rowSpan={subSkills.length}
                                                        className="px-3 py-1 text-xs font-medium align-top"
                                                    >
                                                        <div className="flex flex-col items-start gap-1">
                                                            <div>{skill.skill_name}</div>
                                                            {/* <button
                                                                onClick={() => handleMasterSkillView(skill.skill_name)}
                                                                className="px-2 py-0.5 text-xs text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                                                            >
                                                                View Charts
                                                            </button> */}
                                                        </div>
                                                    </td>
                                                )}

                                                <td className="px-3 py-1 text-xs align-top">{sub.name}</td>
                                                <td className="px-3 py-1 text-xs align-top">
                                                    {renderStars(sub.proficiency)}
                                                </td>
                                                <td className="px-3 py-1 text-xs align-top">
                                                    {sub.experience ? `${Math.floor(sub.experience / 12)}Y, ${sub.experience % 12}m` : "-"}
                                                </td>
                                                <td className="px-3 py-1 text-xs align-top">
                                                    {sub.hasCertification ? "Certified" : "Not Certified"}
                                                </td>
                                                <td className="px-3 py-1 text-xs align-top">
                                                    {sub.status ?? "-"}
                                                </td>
                                                {showEmployeeCell && (
                                                    <td
                                                        rowSpan={employeeRowSpan}
                                                        className={`px-3 py-1 text-xs font-semibold text-center align-top`}
                                                    >
                                                        <div className="text-sm font-medium">{emp.score ?? "-"}</div>
                                                        <div className="text-xs text-gray-600">{emp.coverage ?? "-"}%</div>
                                                    </td>
                                                )}
                                                {/* New: Action button for each sub-skill */}
                                              
                                            </tr>
                                        );
                                    });
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {/* pagination controls centered */}
                <div className="px-4 py-3 border-t bg-gray-50">
                    <div className="flex justify-center items-center gap-3">
                        <button
                            disabled={page <= 1}
                            onClick={() => {
                                const p = Math.max(1, page - 1);
                                setPage(p);
                                fetchResults(p);
                            }}
                            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-sm"
                        >
                            Previous
                        </button>
                        <div className="text-sm text-gray-700">Page {page} of {totalPages}</div>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => {
                                const p = Math.min(totalPages, page + 1);
                                setPage(p);
                                fetchResults(p);
                            }}
                            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
            {/* Loading overlay for modals */}
            {modalLoading && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-[100]">
                    <p className="text-white text-lg">Loading charts...</p>
                </div>
            )}
            {/* Modals are rendered here, they are imported from SharedModals.tsx */}
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