import { useState } from "react";
import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";

function OtpPage() {
  const [otp, setOtp] = useState("");
  const [showDashboard, setShowDashboard] =
    useState(false);

  const [role, setRole] = useState("");

  const verifyOTP = async () => {
    if (!otp) {
      alert("Enter OTP");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            username:
              localStorage.getItem(
                "username"
              ),
            otp,
          }),
        }
      );

      const data =
        await response.json();

      console.log(data);

      if (data.message === "Login Successful") {
        alert("OTP Verified Successfully");
        localStorage.setItem("token", data.token);
        setRole(data.role);
        setShowDashboard(true);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);

      alert(
        "Backend not running"
      );
    }
  };

  if (showDashboard) {
    if (role === "ADMIN") {
      return <AdminDashboard />;
    }

    return <UserDashboard />;
  }

  return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background:
        "linear-gradient(135deg,#0f172a,#1e293b,#2563eb)",
      fontFamily: "Segoe UI, sans-serif",
    }}
  >
    <div
      style={{
        width: "420px",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(15px)",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
        color: "white",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontSize: "30px",
          marginBottom: "10px",
        }}
      >
        OTP Verification
      </h2>

      <p
        style={{
          color: "#cbd5e1",
          marginBottom: "25px",
        }}
      >
        Enter the OTP sent to your email
      </p>

      <input
        type="text"
        placeholder="Enter 6-digit OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        maxLength="6"
        style={{
          width: "100%",
          padding: "15px",
          borderRadius: "10px",
          border: "none",
          textAlign: "center",
          letterSpacing: "5px",
          fontSize: "22px",
          marginBottom: "20px",
        }}
      />

      <button
        onClick={verifyOTP}
        style={{
          width: "100%",
          padding: "15px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        Verify OTP
      </button>
    </div>
  </div>
)
}

export default OtpPage;