import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

const ROLE_COLORS = [
  "#7F77DD","#1D9E75","#D85A30","#D4537E",
  "#378ADD","#639922","#BA7517","#E24B4A"
];

const inputStyle = {
  padding: "7px 11px",
  border: "0.5px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  background: "#fff",
  color: "#111",
};

const btn = (variant = "default") => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "7px 14px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  border: "0.5px solid",
  ...(variant === "primary"    && { background: "#111", color: "#fff", borderColor: "#111" }),
  ...(variant === "disabled"   && { background: "#e5e7eb", color: "#9ca3af", borderColor: "#e5e7eb", cursor: "not-allowed" }),
  ...(variant === "danger"     && { background: "#fff", color: "#b91c1c", borderColor: "#fca5a5" }),
  ...(variant === "success"    && { background: "#fff", color: "#15803d", borderColor: "#86efac" }),
  ...(variant === "default"    && { background: "#fff", color: "#374151", borderColor: "#d1d5db" }),
  ...(variant === "sm"         && { padding: "4px 10px", fontSize: "12px",
                                     background: "#fff", color: "#374151", borderColor: "#d1d5db" }),
  ...(variant === "sm-danger"  && { padding: "4px 10px", fontSize: "12px",
                                     background: "#fff", color: "#b91c1c", borderColor: "#fca5a5" }),
  ...(variant === "sm-success" && { padding: "4px 10px", fontSize: "12px",
                                     background: "#fff", color: "#15803d", borderColor: "#86efac" }),
});

const scoreBadgeStyle = (score) => {
  if (score >= 70) return { background: "#eaf3de", color: "#3B6D11" };
  if (score >= 50) return { background: "#faeeda", color: "#854F0B" };
  return { background: "#fcebeb", color: "#A32D2D" };
};

const badge = (extra = {}) => ({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 500,
  ...extra,
});

const th = { padding: "9px 12px", fontSize: "12px", fontWeight: 500,
              color: "#6b7280", textAlign: "left", textTransform: "uppercase",
              letterSpacing: "0.04em" };
const td = { padding: "10px 12px", borderBottom: "0.5px solid #f3f4f6",
              verticalAlign: "middle" };

function useToast() {
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);

  const show = (m) => {
    setMsg(m); setVisible(true);
    setTimeout(() => setVisible(false), 2200);
  };

  const Toast = () => visible ? (
    <div style={{
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "#111", color: "#fff", padding: "9px 20px",
      borderRadius: "8px", fontSize: "13px", zIndex: 99, pointerEvents: "none"
    }}>{msg}</div>
  ) : null;

  return { show, Toast };
}



function SkillRulesSection({ toast }) {
  const [roles, setRoles]               = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rules, setRules]               = useState([]);

  const [newSkill, setNewSkill] = useState("");
  const [newScore, setNewScore] = useState("");

  const [editId, setEditId]     = useState(null);
  const [editSkill, setEditSkill] = useState("");
  const [editScore, setEditScore] = useState("");

  const [deleteId, setDeleteId] = useState(null);

  const totalWeight  = rules.reduce((s, r) => s + (editId === r[0] ? (parseInt(editScore) || 0) : r[2]), 0);
  const currentTotal = rules.reduce((s, r) => s + r[2], 0);
  const remaining    = 100 - currentTotal;
  const isOverLimit  = currentTotal > 100;
  const isExact      = currentTotal === 100;

  useEffect(() => { fetchRoles(); }, []);

  useEffect(() => {
    if (selectedRole) fetchRules(selectedRole.role_name);
    else setRules([]);
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      const res  = await fetch(`${API}/role-thresholds`);
      const data = await res.json();
      setRoles(data);
      if (data.length > 0) setSelectedRole(data[0]);
    } catch (e) { console.error(e); }
  };

  const fetchRules = async (roleName) => {
    try {
      const res  = await fetch(`${API}/rules?role_name=${encodeURIComponent(roleName)}`);
      const data = await res.json();
      setRules(data);
    } catch (e) { console.error(e); }
  };

  const addRule = async () => {
    if (!selectedRole) { toast("Select a role first"); return; }
    if (!newSkill.trim()) { toast("Enter a skill name"); return; }
    const sc = parseInt(newScore);
    if (isNaN(sc) || sc < 1) { toast("Weightage must be a number ≥ 1"); return; }

    if (totalWeight + sc > 100) {
      toast(`Total weightage would exceed 100 (currently ${totalWeight}, adding ${sc})`);
      return;
    }

    const payload = { skill_name: newSkill.trim(), score: sc, role_name: selectedRole.role_name };
    try {
      const res  = await fetch(`${API}/add-rule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.detail || "Failed to add skill"); return; }
      setNewSkill(""); setNewScore("");
      await fetchRules(selectedRole.role_name);
      toast("Skill added successfully ✓");
    } catch (err) {
      toast("Network error — could not add skill");
    }
  };

  const startEdit  = (rule) => { setEditId(rule[0]); setEditSkill(rule[1]); setEditScore(String(rule[2])); };
  const cancelEdit = ()     => { setEditId(null); setEditSkill(""); setEditScore(""); };

  const saveEdit = async (id) => {
    if (!editSkill.trim()) { toast("Skill name can't be empty"); return; }
    const sc = parseInt(editScore);
    if (isNaN(sc) || sc < 1) { toast("Weightage must be ≥ 1"); return; }

    const otherTotal = rules.filter(r => r[0] !== id).reduce((s, r) => s + r[2], 0);
    if (otherTotal + sc > 100) {
      toast(`Total skill weightage cannot exceed 100 (others sum to ${otherTotal})`);
      return;
    }

    const payload = { skill_name: editSkill.trim(), score: sc, role_name: selectedRole?.role_name };
    try {
      const res  = await fetch(`${API}/update-rule/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.detail || "Error updating skill"); return; }
      cancelEdit();
      await fetchRules(selectedRole.role_name);
      toast("Skill updated successfully ✓");
    } catch (err) {
      toast("Network error — could not update skill");
    }
  };

  const confirmDelete = async (id) => {
    try {
      const res = await fetch(`${API}/delete-rule/${id}`, { method: "DELETE" });
      if (!res.ok) { toast("Failed to delete skill"); return; }
      setDeleteId(null);
      await fetchRules(selectedRole.role_name);
      toast("Skill deleted");
    } catch (err) {
      toast("Network error — could not delete skill");
    }
  };

  return (
    <section>
      
      <div style={{
        display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
        background: "#f8fafc", border: "0.5px solid #e5e7eb",
        borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem"
      }}>
        <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
          Role:
        </label>
        {roles.length === 0 ? (
          <span style={{ fontSize: "13px", color: "#9ca3af" }}>
            No roles yet — add them in the Role Thresholds tab first
          </span>
        ) : (
          <select
            value={selectedRole?.role_name || ""}
            onChange={(e) => {
              const r = roles.find(x => x.role_name === e.target.value);
              setSelectedRole(r || null);
              cancelEdit(); setDeleteId(null);
            }}
            style={{ ...inputStyle, minWidth: "220px" }}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.role_name}>{r.role_name}</option>
            ))}
          </select>
        )}

        {selectedRole && (
          <span style={{
            ...badge(scoreBadgeStyle(selectedRole.accept_score)),
            fontSize: "13px", padding: "4px 12px"
          }}>
            Pass threshold: {selectedRole.accept_score} / 100
          </span>
        )}
      </div>

      {!selectedRole ? (
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>Select a role above to manage its skills.</p>
      ) : (
        <>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "1rem" }}>
            Skills below are scored only for <strong>{selectedRole.role_name}</strong>.
            Total weightage must equal exactly 100.
          </p>

          
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            <input
              style={{ ...inputStyle, width: "220px" }}
              placeholder="Skill name  (e.g. Python)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRule()}
            />
            <input
              style={{ ...inputStyle, width: "100px" }}
              type="number" placeholder="Weightage" min="1" max="100"
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRule()}
            />
            <button style={btn("primary")} onClick={addRule}>+ Add skill</button>
          </div>

          
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #e5e7eb" }}>
                <th style={{ ...th, width: "52px" }}>ID</th>
                <th style={th}>Skill name</th>
                <th style={{ ...th, width: "130px" }}>Weightage</th>
                <th style={{ ...th, width: "180px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 && (
                <tr><td colSpan="4" style={{ ...td, textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
                  No skill rules for <strong>{selectedRole.role_name}</strong> — add one above
                </td></tr>
              )}
              {rules.map((rule) => {
                const isEdit = editId   === rule[0];
                const isDel  = deleteId === rule[0];

                if (isDel) return (
                  <tr key={rule[0]} style={{ background: "#fef2f2" }}>
                    <td style={td}>{rule[0]}</td>
                    <td style={{ ...td, color: "#b91c1c", fontSize: "13px" }} colSpan="2">
                      Delete <strong>{rule[1]}</strong>?
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={btn("sm-danger")} onClick={() => confirmDelete(rule[0])}>🗑 Yes, delete</button>
                        <button style={btn("sm")} onClick={() => setDeleteId(null)}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                );

                if (isEdit) return (
                  <tr key={rule[0]}>
                    <td style={td}>{rule[0]}</td>
                    <td style={td}>
                      <input style={{ ...inputStyle, width: "180px" }}
                        value={editSkill} onChange={(e) => setEditSkill(e.target.value)} />
                    </td>
                    <td style={td}>
                      <input style={{ ...inputStyle, width: "70px" }} type="number" min="1" max="100"
                        value={editScore} onChange={(e) => setEditScore(e.target.value)} />
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={btn("sm-success")} onClick={() => saveEdit(rule[0])}>✓ Save</button>
                        <button style={btn("sm")} onClick={cancelEdit}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                );

                return (
                  <tr key={rule[0]}>
                    <td style={{ ...td, color: "#9ca3af" }}>{rule[0]}</td>
                    <td style={td}>{rule[1]}</td>
                    <td style={td}>
                      <span style={badge({ background: "#eaf3de", color: "#3B6D11" })}>
                        {rule[2]} pts
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={btn("sm")} onClick={() => startEdit(rule)}>✏ Edit</button>
                        <button style={btn("sm-danger")} onClick={() => setDeleteId(rule[0])}>🗑 Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          
          <div style={{
            marginTop: "16px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: isOverLimit ? "#fef2f2" : isExact ? "#f0fdf4" : "#f8fafc",
            border: `0.5px solid ${isOverLimit ? "#fca5a5" : isExact ? "#86efac" : "#e5e7eb"}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "8px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Total Weightage:</span>
              <span style={{
                fontSize: "15px", fontWeight: 700,
                color: isOverLimit ? "#b91c1c" : isExact ? "#15803d" : "#374151"
              }}>
                {currentTotal} / 100
              </span>
              <div style={{ width: "120px", height: "6px", background: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "3px",
                  width: `${Math.min(100, currentTotal)}%`,
                  background: isOverLimit ? "#ef4444" : isExact ? "#22c55e" : "#3b82f6",
                  transition: "width 0.3s"
                }} />
              </div>
            </div>

            {isOverLimit && (
              <span style={{ fontSize: "13px", color: "#b91c1c", fontWeight: 500 }}>
                ⚠ Total skill weightage cannot exceed 100
              </span>
            )}
            {!isOverLimit && !isExact && rules.length > 0 && (
              <span style={{ fontSize: "13px", color: "#92400e" }}>
                Remaining weightage: {remaining}
              </span>
            )}
            {isExact && (
              <span style={{ fontSize: "13px", color: "#15803d", fontWeight: 500 }}>
                ✓ Weightage complete
              </span>
            )}
          </div>

          {rules.length > 0 && !isExact && (
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>
              {isOverLimit
                ? "Remove or reduce skill scores until the total equals 100."
                : `Add ${remaining} more point${remaining !== 1 ? "s" : ""} to reach exactly 100.`}
            </p>
          )}
        </>
      )}
    </section>
  );
}


function RoleThresholdsSection({ toast }) {
  const [roles, setRoles]         = useState([]);
  const [newRole, setNewRole]     = useState("");
  const [newScore, setNewScore]   = useState("");
  const [editId, setEditId]       = useState(null);
  const [editRole, setEditRole]   = useState("");
  const [editScore, setEditScore] = useState("");
  const [deleteId, setDeleteId]   = useState(null);

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API}/role-thresholds`);
      setRoles(await res.json());
    } catch (e) { console.error(e); }
  };

  const addRole = async () => {
    if (!newRole.trim()) { toast("Enter a role name"); return; }
    const sc = parseInt(newScore);
    if (isNaN(sc) || sc < 0 || sc > 100) { toast("Pass mark must be 0 – 100"); return; }
    await fetch(`${API}/add-role-threshold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_name: newRole.trim(), accept_score: sc }),
    });
    setNewRole(""); setNewScore("");
    fetchRoles(); toast("Role added ✓");
  };

  const startEdit  = (r) => { setEditId(r.id); setEditRole(r.role_name); setEditScore(String(r.accept_score)); };
  const cancelEdit = ()  => { setEditId(null); setEditRole(""); setEditScore(""); };

  const saveEdit = async (id) => {
    if (!editRole.trim()) { toast("Role name can't be empty"); return; }
    const sc = parseInt(editScore);
    if (isNaN(sc) || sc < 0 || sc > 100) { toast("Pass mark must be 0 – 100"); return; }
    await fetch(`${API}/update-role-threshold/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_name: editRole.trim(), accept_score: sc }),
    });
    cancelEdit(); fetchRoles(); toast("Role updated ✓");
  };

  const confirmDelete = async (id) => {
    await fetch(`${API}/delete-role-threshold/${id}`, { method: "DELETE" });
    setDeleteId(null); fetchRoles(); toast("Role deleted");
  };

  return (
    <section>
      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "1rem" }}>
        A resume is <strong>Accepted</strong> only if its score meets the role's pass mark.
        Roles added here also appear in the user upload dropdown.
      </p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          style={{ ...inputStyle, width: "260px" }}
          placeholder="Role name  (e.g. Backend Developer)"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addRole()}
        />
        <input
          style={{ ...inputStyle, width: "160px" }}
          type="number" placeholder="Pass mark (0–100)" min="0" max="100"
          value={newScore}
          onChange={(e) => setNewScore(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addRole()}
        />
        <button style={btn("primary")} onClick={addRole}>+ Add role</button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ borderBottom: "1.5px solid #e5e7eb" }}>
            <th style={{ ...th, width: "52px" }}>ID</th>
            <th style={th}>Role name</th>
            <th style={{ ...th, width: "140px" }}>Pass mark</th>
            <th style={{ ...th, width: "180px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.length === 0 && (
            <tr><td colSpan="4" style={{ ...td, textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
              No roles configured — add one above
            </td></tr>
          )}
          {roles.map((r, i) => {
            const isEdit   = editId   === r.id;
            const isDelete = deleteId === r.id;
            const dot      = ROLE_COLORS[i % ROLE_COLORS.length];

            if (isDelete) return (
              <tr key={r.id} style={{ background: "#fef2f2" }}>
                <td style={td}>{r.id}</td>
                <td style={{ ...td, color: "#b91c1c", fontSize: "13px" }} colSpan="2">
                  Delete <strong>{r.role_name}</strong>?
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button style={btn("sm-danger")} onClick={() => confirmDelete(r.id)}>🗑 Yes, delete</button>
                    <button style={btn("sm")} onClick={() => setDeleteId(null)}>Cancel</button>
                  </div>
                </td>
              </tr>
            );

            if (isEdit) return (
              <tr key={r.id}>
                <td style={td}>{r.id}</td>
                <td style={td}>
                  <input style={{ ...inputStyle, width: "220px" }}
                    value={editRole} onChange={(e) => setEditRole(e.target.value)} />
                </td>
                <td style={td}>
                  <input style={{ ...inputStyle, width: "70px" }} type="number" min="0" max="100"
                    value={editScore} onChange={(e) => setEditScore(e.target.value)} />
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button style={btn("sm-success")} onClick={() => saveEdit(r.id)}>✓ Save</button>
                    <button style={btn("sm")} onClick={cancelEdit}>Cancel</button>
                  </div>
                </td>
              </tr>
            );

            return (
              <tr key={r.id}>
                <td style={{ ...td, color: "#9ca3af" }}>{r.id}</td>
                <td style={td}>
                  <span style={{
                    display: "inline-block", width: "8px", height: "8px",
                    borderRadius: "50%", background: dot,
                    marginRight: "8px", verticalAlign: "middle"
                  }} />
                  {r.role_name}
                </td>
                <td style={td}>
                  <span style={badge(scoreBadgeStyle(r.accept_score))}>
                    {r.accept_score} / 100
                  </span>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button style={btn("sm")} onClick={() => startEdit(r)}>✏ Edit</button>
                    <button style={btn("sm-danger")} onClick={() => setDeleteId(r.id)}>🗑 Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}



function ManageRules() {
  const [activeTab, setActiveTab] = useState("skills");
  const { show, Toast } = useToast();

  const tabStyle = (name) => ({
    padding: "10px 22px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    color: activeTab === name ? "#111" : "#6b7280",
    background: "none",
    border: "none",
    borderBottom: activeTab === name ? "2.5px solid #111" : "2.5px solid transparent",
    marginBottom: "-1.5px",
  });

  return (
    <div style={{ padding: "1.5rem 2rem", fontFamily: "sans-serif", color: "#111827" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px", color: "#0f172a" }}>
        Manage Rules
      </h1>
      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "1.5rem" }}>
        Configure role-wise skill scoring rules and acceptance thresholds
      </p>

      <div style={{ display: "flex", borderBottom: "1.5px solid #e5e7eb", marginBottom: "1.5rem" }}>
        <button style={tabStyle("skills")} onClick={() => setActiveTab("skills")}>⚙ Skill Rules</button>
        <button style={tabStyle("roles")}  onClick={() => setActiveTab("roles")}>🎯 Role Thresholds</button>
      </div>

      {activeTab === "skills" && <SkillRulesSection  toast={show} />}
      {activeTab === "roles"  && <RoleThresholdsSection toast={show} />}

      <Toast />
    </div>
  );
}

export default ManageRules;