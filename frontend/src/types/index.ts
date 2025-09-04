export interface User {
  id: number;
  emp_id: string;              // maps to backend's emp_id
  name: string;
  email: string;

  approver_id: number | null;  // approver FK, nullable
  is_approver: boolean;        // replaces is_manager

  designation?: string | null; // optional
  capability?: string | null;  // optional
  is_active: boolean;
  is_available: boolean;

  created_at?: string;         // only if you add it in backend later
  avatar_url?: string;         // optional frontend extension
}


export interface Skill {
  id: number;
  user_id: number;
  skill_name: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  manager_comments?: string;
  sub_skills: SubSkill[];  // always present from backend
}


export interface SubSkill {
  id: number;
  history_id?: number;
  skill_id: number;
  sub_skill_name: string;
  proficiency_level: number;       // employee_proficiency
  experience_years: number;
  has_certification: boolean;
  certification_file_url?: string;
  created_at: string;
  skill_name?: string;
  subskill_id?: number;

  certification_creation_date?: string | null;
  certification_expiration_date?: string | null;

  // Add manager-reviewed properties
  manager_proficiency?: number;    // optional
  status?: "pending" | "approved" | "rejected";
  manager_comments?: string;
}

// Separate interface ONLY for when submitting new skills
export interface SkillSubmission {
  id: number;
  user_id: number;
  skill_name: string;
  sub_skills: SubSkillData[]; 
  status: 'pending' | 'approved' | 'rejected';
  manager_comments?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  updated_at?: string;
}


export interface SubSkillData {
  id?: number;
  name: string;
  proficiency: number;
  experience: number;
  hasCertification?: boolean;
  status?: string;  
  // Accept File OR string (URL) OR undefined
  certificationFile?: File | string | null;
  certificationCreationDate?: string | null;   // NEW
  certificationExpirationDate?: string | null; // NEW
  employeeName?: string;
  employeeId?: string;
  coverage?:number;
}


export interface SkillFilter {
  skill?: string;
  proficiency?: number;
  min_experience?: number;
  max_experience?: number;
  hasCertification?: boolean;
}


// Interface used specifically for UpdateSkillModal
export interface SubSkillUpdate {
  id?:number;
  emp_skill_id?: number;
  history_id?: number;
  employee_id: number;
  subskill_id: number;
  skill_name: string | undefined;
  sub_skill_name: string;         // unified naming
  proficiency_level: number;      // use _level everywhere
  experience_years: number;       // unified naming
  has_certification: boolean;
  certification_file_url?: string;
  certification_creation_date?: string | null;
  certification_expiration_date?: string | null;
  status: "pending" | "approved" | "rejected";
}
