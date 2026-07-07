import { useState } from "react";
import OtpPage from "./Otp";
import RegisterPage from "./pages/RegisterPage";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showOTP, setShowOTP] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const login = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();
      alert(JSON.stringify(data));

      console.log(data);

      if (data.message === "OTP Sent") {

        localStorage.setItem(
          "username",
          data.username
        );

        setShowOTP(true);

      } else {
        alert(data.message);
      }

    } catch (error) {
      console.log(error);
      alert("Backend not running!");
    }
  };

  if (showOTP) {
    return <OtpPage />;
  }

  if (showRegister) {

    return (
      <div>
        <RegisterPage onBack={() => setShowRegister(false)} />

        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
          }}
        >
          <button
            onClick={() =>
              setShowRegister(false)
            }
          >
            Back To Login
          </button>
        </div>
      </div>
    );
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
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            marginBottom: "5px",
            fontSize: "32px",
            fontWeight: "700",
          }}
        >
          ATS Portal
        </h1>

        <p
          style={{
            color: "#cbd5e1",
            marginBottom: "30px",
          }}
        >
          Secure Resume Screening Platform
        </p>
      </div>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          width: "100%",
          padding: "14px",
          marginBottom: "15px",
          borderRadius: "10px",
          border: "none",
          fontSize: "15px",
        }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: "14px",
          marginBottom: "20px",
          borderRadius: "10px",
          border: "none",
          fontSize: "15px",
        }}
      />

      <button
        onClick={login}
        style={{
          width: "100%",
          padding: "14px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        Sign In
      </button>

      <div
        style={{
          textAlign: "center",
          marginTop: "20px",
        }}
      >
        <p style={{ color: "#cbd5e1" }}>
          Don't have an account?
        </p>

        <button
          onClick={() => setShowRegister(true)}
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "10px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Create Account
        </button>
      </div>
    </div>
  </div>
  );
}

export default App;