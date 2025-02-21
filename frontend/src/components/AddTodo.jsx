import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  const today = new Date().toISOString().split("T")[0];
function AddTodo({ user }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  const handleAddTodo = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/todos`, {
        user_id: user.id,
        title,
        description,
        completed,
        priority,
        due_date: dueDate
      });
      alert("Todo added successfully!");
      navigate("/todos");
    } catch (err) {
      console.error(err);
      alert("Error adding todo: " + (err.response?.data || err.message));
    }
  };

  return (
    <div>
      <button onClick={() => navigate(-1)} className="logout-btn" style={{ position: "absolute", top: "10px", left: "10px", width:"5%" }} >← Back</button>
    <form onSubmit={handleAddTodo} className="container">
      <h2 className="todo-list-header">Add Todo</h2>
      <label>Title</label>
      <input
        type="text" className="login-input-field" onChange={(e) => setTitle(e.target.value)}
      /><br></br><label>Description</label>
      <textarea 
        className="login-input-field"
        onChange={(e) => setDescription(e.target.value)}
      /><br></br>
      <label>Priority (1-5)</label>
      <input
        type="number"
        min="1"
        max="5"
        className="login-input-field"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      /><br></br>
      <label>Due Date</label>
      <input
        type="date"
        className="login-input-field"
        value={dueDate}
        min={today}
        onChange={(e) => setDueDate(e.target.value)}
      /><br></br>
      <label>
        <input
          type="checkbox"
          className="mr-2"
          checked={completed}
          onChange={(e) => setCompleted(e.target.checked)}
        />
        Mark as Completed
      </label><br></br><br></br>
      <button type="submit" className="submit-button">
        Add Todo
      </button>
    </form>
    </div>
  );
}

export default AddTodo;
