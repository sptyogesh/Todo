import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login.jsx";
import Signup from "./components/Signup.jsx";
import TodoList from "./components/TodoList.jsx";
import AddTodo from "./components/AddTodo.jsx";
import TodoHistory from "./components/TodoHistory.jsx";
import EditTodo from "./components/EditTodo.jsx";
import ViewTodo from "./components/ViewTodo.jsx";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <div>
      <nav>
        <h1 className="app-title">Todo App</h1>
      </nav>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/todos" /> : <Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/todos" element={user ? <TodoList user={user} /> : <Navigate to="/" />} />
        <Route path="/add-todo" element={user ? <AddTodo user={user} /> : <Navigate to="/" />} />
        <Route path="/edit-todo/:id" element={user ? <EditTodo user={user} /> : <Navigate to="/" />} />
        <Route path="/todo-history/:id" element={user ? <TodoHistory user={user} /> : <Navigate to="/" />} />
        <Route path="/view-todo/:id" element={<ViewTodo />} />
      </Routes>
    </div>
  );
}

export default App;
