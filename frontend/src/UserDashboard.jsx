import { useState, useEffect } from "react";
import AdminDashboard from "./AdminDashboard";

function UserDashboard() {

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [activePage, setActivePage] =
  useState("upload");

  // Role selection
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");

  // Resume lookup
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/role-thresholds");
      const data = await res.json();
      setRoles(data);
      if (data.length > 0) setSelectedRole(data[0].role_name);
    } catch (err) {
      console.error("Could not load roles:", err);
    }
  };

  const uploadResume = async () => {
    if (!file) {
      setUploadError("Please select a resume file.");
      return;
    }
    if (!selectedRole) {
      setUploadError("Please select a job role.");
      return;
    }

    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`File is too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`);
      return;
    }

    setUploadError("");
    setResult(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_role", selectedRole);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload-resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.detail || "Upload failed. Please try again.");
        return;
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setUploadError("Upload failed. Could not reach the server.");
    } finally {
      setUploading(false);
    }
  };

  const lookupResume = async () => {
    if (!lookupId) return;
    setLookupError("");
    setLookupResult(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/resume/${lookupId}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.detail || "Resume not found.");
        return;
      }
      setLookupResult(data);
    } catch (err) {
      console.error(err);
      setLookupError("Could not reach the server.");
    }
  };

  const statusColor = (s) => (s === "Accepted" ? "#16a34a" : "#dc2626");

  const cardStyle = {
    display: "inline-block",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "24px 32px",
    backgroundColor: "#f9fafb", 
    marginTop: "18px",
    textAlign: "left",
    minWidth: "320px"
  };

  const badgeStyle = (color) => ({
    display: "inline-block",
    backgroundColor: color,
    color: "#fff",
    borderRadius: "6px",
    padding: "3px 12px",
    fontWeight: "bold",
    fontSize: "14px"
  });

  const sidebarBtn = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
  padding: "14px",
  borderRadius: "12px",
  cursor: "pointer",
  textAlign: "left",
  fontSize: "15px",
  fontWeight: "500",
};

  const actionBtn = {
    padding: "13px 18px",
    backgroundColor: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "Segoe UI",
      }}
    >
      {/* Sidebar */}

     <div
  style={{
    width: "260px",
    background: "#0f172a",
    color: "white",
    padding: "25px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  }}
>
  <div>
    <div
      style={{
        textAlign: "center",
        marginBottom: "40px",
      }}
    >
      <h1
        style={{
          color: "#60a5fa",
          marginBottom: "5px",
        }}
      >
        ATS
      </h1>

      <p
        style={{
          color: "#cbd5e1",
          fontSize: "13px",
        }}
      >
        Resume Screening Portal
      </p>
    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
      }}
    >
      <button
        onClick={() => setActivePage("upload")}
        style={sidebarBtn}
      >
        📄 Dashboard
      </button>

      <button
        onClick={() => setActivePage("results")}
        style={sidebarBtn}
      >
        📊 My Results
      </button>

      <button
        onClick={() => setActivePage("lookup")}
        style={sidebarBtn}
      >
        🔍 Resume Lookup
      </button>
    </div>
  </div>

  <button
    onClick={() => {
      localStorage.clear();
      window.location.reload();
    }}
    style={{
      background: "#dc2626",
      color: "white",
      border: "none",
      padding: "12px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
     Logout
  </button>
</div>

      {/* Main */}

      <div
        style={{
          flex: 1,
          padding: "40px",
        }}
      >
        {activePage === "upload" && (
          <>
            <h1
  style={{
    color: "#0f172a",
    fontSize: "42px",
    fontWeight: "700",
    marginBottom: "10px",
  }}
>
  Welcome Back 👋
</h1>
            <p>Upload your resume for ATS screening</p>

            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "15px",
                marginTop: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "grid", gap: "24px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
                    Job Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    {roles.map((role) => (
                      <option key={role.role_name} value={role.role_name}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
                    Resume File
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFile(e.target.files[0] || null)}
                    style={{ width: "100%" }}
                  />
                </div>

                {uploadError && <p style={{ color: "#dc2626" }}>{uploadError}</p>}

                <button onClick={uploadResume} disabled={uploading} style={actionBtn}>
                  {uploading ? "Uploading..." : "Upload Resume"}
                </button>

                {result && (
                  <div style={cardStyle}>
                    <h2>Upload Result
                        
                    </h2>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span style={badgeStyle(statusColor(result.status || ""))}>
                        {result.status || "Unknown"}
                      </span>
                    </p>
                    {result.score !== undefined && <p><strong>Score:</strong> {result.score}</p>}
                    {result.resume_id && <p><strong>Resume ID:</strong> {result.resume_id}</p>}
                    {result.job_role && <p><strong>Job Role:</strong> {result.job_role}</p>}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activePage === "results" && (
          <div>
            <h1
  style={{
    color: "#0f172a",
    fontSize: "42px",
    fontWeight: "700",
    marginBottom: "10px",
  }}
>
  My Results
</h1>

            {result ? (
              <div style={cardStyle}>
                <h2 style={{ color: "#0f172a" }}>ATS Analysis Report</h2>
                <p><strong>Resume ID:</strong> {result.resume_id}</p>
                <p><strong>Score:</strong> {result.score}</p>
                <p><strong>Status:</strong> {result.status}</p>
              </div>
            ) : (
              <p>No result available yet.</p>
            )}
          </div>
        )}

        {activePage === "lookup" && (
          <div>
            <h1
  style={{
    color: "#0f172a",
    fontSize: "42px",
    fontWeight: "700",
    marginBottom: "10px",
  }}
>
  Resume Lookup
</h1>

            <input
              type="text"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Enter Resume ID"
            />

            <button onClick={lookupResume} style={actionBtn}>
              Search
            </button>

            {lookupResult && (
              <div style={cardStyle}>
                <h2>Resume Details</h2>
                <p><strong>ID:</strong> {lookupResult.resume_id}</p>
                <p><strong>Score:</strong> {lookupResult.score}</p>
                <p><strong>Status:</strong> {lookupResult.status}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;