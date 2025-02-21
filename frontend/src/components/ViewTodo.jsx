import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");

function ViewTodo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/todos/${id}`)
      .then((res) => {
        setTodo(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching todo:", err);
        alert("Todo not found!");
        navigate("/todos");
      });
  }, [id, navigate]);

  if (loading) return <p>Loading...</p>;

  return (
    <div><button onClick={() => navigate(-1)} className="logout-btn" style={{ position: "absolute", top: "10px", left: "10px", width:"5%" }}>← Back</button>
    <div className="container">
      
      <h2 className="todo-list-header login-input-field">Title: {todo.title}</h2>
      <p className="login-input-field"><strong>Description:</strong> {todo.description}</p>
      <p className="login-input-field"><strong>Priority:</strong> {todo.priority}</p>
      <p className="login-input-field"><strong>Due Date:</strong> {todo.due_date || "No due date"}</p>
      <p className="login-input-field"><strong>Status:</strong> {todo.completed ? "Completed ✔" : "Pending ⏳"}</p>
      <p className="login-input-field"><strong>Created At:</strong> {todo.created_at}</p>
      {todo.completed && todo.completed_at && ( <p className="login-input-field"> <strong>Completed At:</strong> {todo.completed_at ? todo.completed_at : "N/A"} </p> )}

    </div></div>
  );
}

export default ViewTodo;
