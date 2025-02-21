import React from "react";
import TodoList from "../components/TodoList";
import TodoForm from "../components/TodoForm";

const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <TodoForm />
      <TodoList />
    </div>
  );
};

export default Dashboard;
