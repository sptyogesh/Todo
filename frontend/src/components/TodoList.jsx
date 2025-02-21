import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");

function TodoList({ user }) {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_BASE_URL}/todos`)
      .then((res) => setTodos(res.data))
      .catch((err) => console.error("Error fetching todos:", err));
  }, [user.id]);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      axios.delete(`${API_BASE_URL}/users/${user.id}`)
        .then(() => {
          localStorage.removeItem("user");
          navigate("/");
        })
        .catch((err) => console.error("Error deleting account:", err));
    }
  };
  const handleDeleteTodo = (todoId) => {
    if (window.confirm("Are you sure you want to delete this todo?")) {
      axios.delete(`${API_BASE_URL}/todos/${todoId}`)
        .then(() => {
          setTodos(todos.filter(todo => todo.id !== todoId));
        })
        .catch((err) => console.error("Error deleting todo:", err));
    }
  };
  
  const filteredTodos = todos.filter(todo => {
    if (filter === "pending") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  return (
    <div className="container">
      <div className="user-dropdown" style={{ position: "absolute", top: "10px", left: "10px" }}>
      <button onClick={handleLogout} className="logout-btn">HOME</button>
      </div>
      <div className="user-dropdown" style={{ position: "absolute", top: "10px", right: "10px" }}>
        <button onClick={toggleDropdown} className="user-btn">{user.name} ▼  </button> 
        {dropdownOpen && (
          <div className="dropdown-menu">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
            <button onClick={handleDeleteAccount} className="delete-btn">Delete Account</button>
          </div>
        )}
      </div>
      <p><strong>Last Login:</strong> {user.last_login}</p>
      <div className="todo-list-header">
        <h2>Your Todos</h2>
        <button onClick={() => navigate("/add-todo")} className="add-todo-btn">
          + Add Todo
        </button>
      </div>
      <div className="todo-filter-buttons">
        <button onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>All</button>
        <button onClick={() => setFilter("pending")} className={filter === "pending" ? "active" : ""}>Pending</button>
        <button onClick={() => setFilter("completed")} className={filter === "completed" ? "active" : ""}>Completed</button>
      </div><p className="completed" style={{top:"300px"}}>Status</p>

      <ul className="todo-list">
  {filteredTodos.map((todo) => (
    <li key={todo.id} className="todo-item">
      <span>{todo.title}</span>
      
      {Number(todo.user_id) === Number(user.id) && (
        <div className="todo-actions">
          <Link to={`/edit-todo/${todo.id}`} className="edit-btn" >Edit</Link>
          <Link to={`/todo-history/${todo.id}`} className="history-btn">History</Link>
          <button onClick={() => handleDeleteTodo(todo.id)} className="delete-btn1" >Delete</button>
        </div>
      )}
       <Link to={`/view-todo/${todo.id}`} className="view-btn">View</Link>
       <span className="completed" title="status" >{todo.completed ? "✔" : "⏳"}</span>
    </li>
  ))}
</ul>

    </div>
  );
}

export default TodoList;
