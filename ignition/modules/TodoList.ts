import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TodoListModule = buildModule("TodoListModule", (m) => {
  const todoList = m.contract("TodoList");

  return { todoList };
});

export default TodoListModule;
