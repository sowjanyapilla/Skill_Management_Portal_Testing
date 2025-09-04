import React, { useState, useEffect } from "react";
import { X, FileText } from "lucide-react";

interface ResumeUploadModalProps {
  onClose: (shouldSubmit: boolean) => void;
}

export default function ResumeUploadModal({ onClose }: ResumeUploadModalProps) {
  const [existingResumeUrl, setExistingResumeUrl] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch existing resume on modal open
    const fetchExistingResume = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/skills/resumes/my-resume`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.resume_url) {
            setExistingResumeUrl(data.resume_url);
          }
        }
      } catch (err) {
        console.error("Failed to fetch existing resume:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExistingResume();
  }, [BACKEND_URL, token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleUploadAndClose = async () => {
    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    if (resumeFile) {
        formData.append("resume_file", resumeFile);
    }
    
    try {
        const res = await fetch(`${BACKEND_URL}/skills/resumes/upload`, {
            method: "POST",
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || "Failed to upload resume.");
        }

        onClose(true); // Signal to the parent that submission should proceed
        
    } catch (err: any) {
        setErrorMessage(err.message);
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Upload Resume</h3>
          <button onClick={() => onClose(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {existingResumeUrl && (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                <a href={existingResumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate">
                  View Current Resume
                </a>
              </div>
            )}
            
            <p className="text-sm text-gray-700">
                You can upload a new resume here. This will replace the existing one.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Resume</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full px-2 py-1 border rounded text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              />
            </div>

            {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
            
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => onClose(true)} 
                className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadAndClose}
                disabled={!resumeFile || loading}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${!resumeFile || loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? "Uploading..." : "Upload & Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
