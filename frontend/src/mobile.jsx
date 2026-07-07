import { useState } from "react";
import OtpPage from "./Otp";

function MobilePage() {
  const [mobile, setMobile] = useState("");
  const [showOTP, setShowOTP] = useState(false);

  const sendOTP = async () => {
  if (mobile.length !== 10) {
    alert("Enter Valid Mobile Number");
    return;
  }

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/send-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: mobile,
        }),
      }
    );

  const data = await response.json();

console.log(data);

alert("OTP Sent Successfully");
setShowOTP(true);
  } catch (error) {
    console.log(error);
    alert("Backend not running!");
  }
};

  if (showOTP) {
    return <OtpPage mobile={mobile} />;
  }

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "#f4f4f4",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "50px",
          width: "400px",
          borderRadius: "12px",
          boxShadow: "0px 0px 15px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "black",
            fontSize: "32px",
            fontWeight: "bold",
            marginBottom: "40px",
          }}
        >
          Mobile Verification
        </h1>

        <input
          type="text"
          placeholder="Enter Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          maxLength="10"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            fontSize: "16px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={sendOTP}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "black",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Send OTP
        </button>
      </div>
    </div>
  );
}

export default MobilePage;