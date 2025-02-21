import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`${API_BASE_URL}/users/${email}`);
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);
        navigate("/todos");
      } else {
        alert("Invalid email or password");
      }
    } catch (err) {
      console.error(err);
      alert("Error logging in");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form onSubmit={handleLogin}>
        <label>Email</label>
        <input type="email" className="login-input-field" onChange={(e) => setEmail(e.target.value)} /><br></br>
        <label>Password</label>
        <input type="password" className="login-input-field" onChange={(e) => setPassword(e.target.value)} /><br></br>
        <button type="submit" className="submit-button"> Login </button>
      </form>
      <p className="signup-text">
        Don't have an account?{" "}
        <Link to="/signup" className="signup-link">Sign Up</Link>
      </p>
    </div>
  );
}

export default Login;
