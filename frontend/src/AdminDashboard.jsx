import { useEffect, useState } from "react";
import ManageRules from "./ManageRules";

function AdminDashboard() {
  const [resumes, setResumes] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResumes = resumes.filter((resume) => {
    const lowercaseTerm = searchTerm.toLowerCase();
    return (
      resume.username?.toLowerCase().includes(lowercaseTerm) ||
      resume.filename?.toLowerCase().includes(lowercaseTerm) ||
      resume.job_role?.toLowerCase().includes(lowercaseTerm)
    );
  });

  const handleDownloadReport = () => {
    const header = [
      "Username",
      "Resume Filename",
      "Job Role",
      "Score",
      "Status",
    ];

    const escapeCsvValue = (value) => {
      const stringValue = value === undefined || value === null ? "" : String(value);
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = filteredResumes.map((resume) => [
      resume.username,
      resume.filename,
      resume.job_role,
      resume.score,
      resume.status,
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "resume_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetch("http://127.0.0.1:8000/all-resumes")
      .then((response) => response.json())
      .then((data) => {
        setResumes(data.resumes || []);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const acceptedCount = resumes.filter(
    (r) => r.status === "Accepted"
  ).length;

  const rejectedCount = resumes.filter(
    (r) => r.status === "Rejected"
  ).length;

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

  const cardStyle = {
    background: "white",
    borderRadius: "15px",
    padding: "25px",
    minWidth: "220px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    textAlign: "center",
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
              }}
            >
              Admin Portal
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
              onClick={() => setActivePage("dashboard")}
              style={sidebarBtn}
            >
              📊 Dashboard
            </button>

            <button
              onClick={() => setActivePage("resumes")}
              style={sidebarBtn}
            >
              📄 Resumes
            </button>

            <button
              onClick={() => setActivePage("rules")}
              style={sidebarBtn}
            >
              ⚙ Rules
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

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: "40px",
        }}
      >
        {activePage === "dashboard" && (
          <>
            <h1 style={{ color: "#0f172a" }}>
              Dashboard Overview
            </h1>

            <div
              style={{
                display: "flex",
                gap: "20px",
                marginTop: "25px",
                flexWrap: "wrap",
              }}
            >
              <div style={cardStyle}>
                <h2 style={{ color: "#2563eb" }}>
  {resumes.length}
</h2>
                <p>Total Resumes</p>
              </div>

              <div style={cardStyle}>
                <h2 style={{ color: "#16a34a" }}>
                  {acceptedCount}
                </h2>
                <p>Accepted</p>
              </div>

              <div style={cardStyle}>
                <h2 style={{ color: "#dc2626" }}>
                  {rejectedCount}
                </h2>
                <p>Rejected</p>
              </div>
            </div>
          </>
        )}

        {activePage === "resumes" && (
  <>
    <h1 style={{ color: "#0f172a" }}>
      Resume Management
    </h1>

    <div style={{ marginTop: "20px" }}>
      <input
        type="text"
        placeholder="Search by Username, Resume Name or Job Role..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "12px",
          border: "1px solid #cbd5e1",
          borderRadius: "10px",
          fontSize: "14px",
          outline: "none",
          background: "white",
          color: "#111827",
        }}
      />
    </div>

    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        background: "white",
        marginTop: "20px",
        borderRadius: "15px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <thead>
        <tr style={{ background: "#0f172a", color: "white" }}>
          <th style={{ padding: "12px" }}>Username</th>
          <th>Resume</th>
          <th>Job Role</th>
          <th>Score</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {filteredResumes.length > 0 ? (
          filteredResumes.map((resume, index) => (
            <tr key={index}>
              <td style={{ padding: "12px" }}>
                {resume.username}
              </td>

              <td>{resume.filename}</td>

              <td>{resume.job_role || "—"}</td>

              <td>{resume.score}</td>

              <td
                style={{
                  color:
                    resume.status === "Accepted" 
                      ? "#16a34a"
                      : "#dc2626",
                  fontWeight: "bold",
                }}
              >
                {resume.status}
              </td>

              <td>
                <button
                  onClick={() =>
                    window.open(
                      `http://127.0.0.1:8000/download-resume/${resume.filename}`,
                      "_blank"
                    )
                  }
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Download
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan="6"
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#64748b",
              }}
            >
              No resumes found
            </td>
          </tr>
        )}
      </tbody>
    </table>

    <button
      onClick={handleDownloadReport}
      style={{
        marginTop: "20px",
        background: "#2563eb",
        color: "white",
        border: "none",
        padding: "12px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
        boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
      }}
    >
      ⬇ Download Results Report
    </button>
  </>
)}

        {activePage === "rules" && <ManageRules />}
      </div>
    </div>
  );
}

export default AdminDashboard;