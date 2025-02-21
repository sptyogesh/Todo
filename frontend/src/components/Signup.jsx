import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/users`, { name, email, password });
      alert("Signup successful! Please log in.");
    } catch (err) {
      console.error(err);
      alert("Signup failed: " + (err.response?.data || err.message));
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Signup</h2>
      <form onSubmit={handleSignup}>
        <label>Name</label>
        <input type="text" className="login-input-field" onChange={(e) => setName(e.target.value)} /><br />
        <label>Email</label>
        <input type="email" className="login-input-field" onChange={(e) => setEmail(e.target.value)} /><br />
        <label>Password</label>
        <input type="password" className="login-input-field" onChange={(e) => setPassword(e.target.value)} /><br />
        <button type="submit" className="submit-button">Signup</button>
      </form>
      <p className="signup-text">
        Already have an account?{" "}
        <Link to="/" className="signup-link">Login</Link>
      </p>
    </div>
  );
}

export default Signup;
