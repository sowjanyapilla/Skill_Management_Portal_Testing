export interface User {
  id: number;
  email: string;
  name: string;
  employee_id: string;
  is_manager: boolean;
  manager_id: number | null;   // nullable because sometimes it can be null
  created_at?: string;         // optional if not always included
  avatar_url?: string;         // optional if you plan to add later
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
  skill_id: number;
  sub_skill_name: string;
  proficiency_level: number;       // employee_proficiency
  experience_years: number;
  has_certification: boolean;
  certification_file_url?: string;
  created_at: string;

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
  id?: number;                  // for sub-skill id from backend
  name: string;                 // fallback if creating a new sub-skill
  proficiency: number;
  experience: number;
  hasCertification: boolean;
  certificationFile?: File;
  employeeName?: string;
  employeeId?: string;
}


export interface SkillFilter {
  skill?: string;
  proficiency?: number;
  experience?: number;
  hasCertification?: boolean;
}