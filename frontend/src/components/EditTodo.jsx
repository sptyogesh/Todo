import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");

function EditTodo({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [completed, setCompleted] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  // Set today's date to be used as the minimum due date
 // Format it as YYYY-MM-DD

  useEffect(() => {
    axios.get(`${API_BASE_URL}/todos/${id}`)
      .then((res) => {
        const todo = res.data;
        setTitle(todo.title);
        setDescription(todo.description);
        setPriority(todo.priority);
        setDueDate(todo.due_date);
        setCompleted(todo.completed);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching todo:", err);
        alert("Todo not found!");
        navigate("/todos");
      });
  }, [id, navigate]);

  const handleUpdateTodo = async (e) => {
    e.preventDefault();
    if (!reason) {
      alert("Please provide a reason for updating the todo.");
      return;
    }
    try {
      await axios.put(`${API_BASE_URL}/${id}/todos`, {
        title,
        description,
        completed,
        priority,
        due_date: dueDate,
        user_id: user.id,
        reason,
      });
      alert("Todo updated successfully!");
      navigate("/todos");
    } catch (err) {
      console.error("Error updating todo:", err);
      alert("Failed to update todo.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="logout-btn" style={{ position: "absolute", top: "10px", left: "10px", width: "5%" }}>← Back</button>
      <form onSubmit={handleUpdateTodo} className="container">
        <h2 className="todo-list-header">Edit Todo</h2>
        <label>Title</label>
        <input
          type="text"
          className="login-input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        /><br />
        <label>Description</label>
        <textarea
          className="login-input-field"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        /><br />
        <label>Priority (1-5)</label>
        <input
          type="number"
          min="1"
          max="5"
          className="login-input-field"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        /><br />
        <label>Due Date</label>
        <input
          className="login-input-field"
          value={dueDate}
        /><br />
        <label>
          <input
            type="checkbox"
            className="checkbox"
            checked={completed}
            onChange={(e) => setCompleted(e.target.checked)}
          />
          Mark as Completed
        </label><br /><br />
        <label>Reason</label>
        <textarea
          placeholder="Reason for update"
          className="login-input-field"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button type="submit" className="submit-button">
          Update Todo
        </button>
      </form>
    </div>
  );
}

export default EditTodo;
