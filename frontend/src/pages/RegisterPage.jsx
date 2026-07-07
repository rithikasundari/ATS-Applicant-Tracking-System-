import { useState } from "react";

function RegisterPage({ onBack }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [errors, setErrors] = useState({});

 

  const validateUsername = (value) => {
    if (!value) return "Username is required";
    if (value.length < 3)
      return "Username must be at least 3 characters"; 
    if (!/^[A-Za-z0-9_]+$/.test(value))
      return "Username can only contain letters, numbers, and underscores";
    return "";
  };

  const validateEmail = (value) => {
    if (!value) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Enter a valid email address";
    return "";
  };

  const validateMobile = (value) => {
    if (!value) return "Mobile number is required";
    if (!/^[6-9]\d{9}$/.test(value))
      return "Enter a valid 10-digit mobile number starting with 6-9";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password is required";
    if (value.length < 8)
      return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(value))
      return "Password must contain at least 1 uppercase letter";
    if (!/[a-z]/.test(value))
      return "Password must contain at least 1 lowercase letter";
    if (!/[0-9]/.test(value))
      return "Password must contain at least 1 number";
    if (!/[^A-Za-z0-9]/.test(value))
      return "Password must contain at least 1 special character";
    return "";
  };

  const validateConfirmPassword = (value, passwordValue) => {
    if (!value) return "Please confirm your password";
    if (value !== passwordValue)
      return "Passwords do not match";
    return "";
  };

  const validateAll = () => {
    const newErrors = {
      username: validateUsername(username),
      email: validateEmail(email),
      mobile: validateMobile(mobile),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(
        confirmPassword,
        password
      ),
    };

    setErrors(newErrors);

    return Object.values(newErrors).every(
      (msg) => msg === ""
    );
  };



  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    setErrors((prev) => ({
      ...prev,
      username: validateUsername(value),
    }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: validateEmail(value),
    }));
  };

  const handleMobileChange = (e) => {
    const value = e.target.value;
    setMobile(value);
    setErrors((prev) => ({
      ...prev,
      mobile: validateMobile(value),
    }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setErrors((prev) => ({
      ...prev,
      password: validatePassword(value),
      confirmPassword: validateConfirmPassword(
        confirmPassword,
        value
      ),
    }));
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setErrors((prev) => ({
      ...prev,
      confirmPassword: validateConfirmPassword(
        value,
        password
      ),
    }));
  };

  
  const registerUser = async () => {
    const isValid = validateAll();

    if (!isValid) {
      return;
    }

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            mobile,
            password,
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      if (data.message) {

        alert(data.message);

        setUsername("");
        setEmail("");
        setMobile("");
        setPassword("");
        setConfirmPassword("");
        setErrors({});

      } else if (data.detail) {

        alert(data.detail);

      } else {

        alert(JSON.stringify(data));

      }

    } catch (error) {

      console.error(error);

      alert("Registration Failed");

    }
  };


  const getInputStyle = (hasError) => ({
    width: "100%",
    padding: "12px",
    marginBottom: hasError ? "4px" : "12px",
    borderRadius: "10px",
    border: hasError
      ? "2px solid #ef4444"
      : "1px solid transparent",
    outline: "none",
    fontSize: "16px",
    boxSizing: "border-box",
  });

  const errorTextStyle = {
    color: "#f87171",
    fontSize: "13px",
    marginBottom: "12px",
    marginTop: "2px",
    minHeight: "16px",
  };

  return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background:
        "linear-gradient(135deg, #081229 0%, #0f2a66 50%, #2563eb 100%)",
      fontFamily: "Arial, sans-serif",
      padding: "20px",
    }}
  >
    <div
      style={{
        width: "450px",
        padding: "35px",
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(15px)",
        borderRadius: "25px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      <h1
        style={{
          color: "white",
          textAlign: "center",
          marginBottom: "5px",
        }}
      >
        ATS Portal
      </h1>

      <p
        style={{
          color: "#d1d5db",
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        Create Your Account
      </p>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={handleUsernameChange}
        style={getInputStyle(!!errors.username)}
      />
      <div style={errorTextStyle}>
        {errors.username}
      </div>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={handleEmailChange}
        style={getInputStyle(!!errors.email)}
      />
      <div style={errorTextStyle}>
        {errors.email}
      </div>

      <input
        type="text"
        placeholder="Mobile Number"
        value={mobile}
        onChange={handleMobileChange}
        style={getInputStyle(!!errors.mobile)}
      />
      <div style={errorTextStyle}>
        {errors.mobile}
      </div>

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={handlePasswordChange}
        style={getInputStyle(!!errors.password)}
      />
      <div style={errorTextStyle}>
        {errors.password}
      </div>

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={handleConfirmPasswordChange}
        style={getInputStyle(!!errors.confirmPassword)}
      />
      <div style={errorTextStyle}>
        {errors.confirmPassword}
      </div>

      <button
        onClick={registerUser}
        style={{
          width: "100%",
          padding: "14px",
          border: "none",
          borderRadius: "12px",
          background: "#22c55e",
          color: "white",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
          marginTop: "15px",
        }}
      >
        Create Account
      </button>

      <p
        style={{
          color: "#d1d5db",
          textAlign: "center",
          marginTop: "20px",
        }}
      >
        Already have an account?
      </p>

      <button
  onClick={onBack}
  style={{
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "#2563eb",
    color: "white",
    fontSize: "16px",     
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  Back To Login
</button>
    </div>
  </div>
  );

}

export default RegisterPage;