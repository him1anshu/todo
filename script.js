let todos = [
  {
    id: 1,
    display: "Shopping",
    description: "List: Apple, Milk, Spinach.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    display: "Cycling",
    description: "For 10 minutes between 8 A.M. to 10 A.M.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const todoList = document.querySelector("#todo-list");

function populateTodoList(todo) {
  const todoElement = document.createElement("div");
  todoElement.setAttribute("class", "todo-element");
  todoElement.setAttribute("id", `todo-element-${todo.id}`);

  const checkbox = document.createElement("input");
  checkbox.setAttribute("type", "checkbox");
  checkbox.setAttribute("id", `${todo.id}-checkbox`);
  checkbox.setAttribute("name", "completed");
  todoElement.appendChild(checkbox);

  const todoText = document.createElement("p");
  todoText.setAttribute("class", "todo-text");
  todoText.textContent = todo.display;
  todoElement.appendChild(todoText);

  const viewBtn = document.createElement("button");
  viewBtn.setAttribute("type", "button");
  viewBtn.setAttribute("class", "view");
  viewBtn.setAttribute("id", `${todo.id}-view`);

  const viewBtnIcon = document.createElement("i");
  viewBtnIcon.setAttribute("class", "fa-solid fa-eye");
  viewBtnIcon.setAttribute("id", `${todo.id}-delete`);
  viewBtn.appendChild(viewBtnIcon);
  todoElement.appendChild(viewBtn);

  const editBtn = document.createElement("button");
  editBtn.setAttribute("type", "button");
  editBtn.setAttribute("class", "edit");
  editBtn.setAttribute("id", `${todo.id}-edit`);

  const editBtnIcon = document.createElement("i");
  editBtnIcon.setAttribute("class", "fa-solid fa-pen-to-square");
  editBtnIcon.setAttribute("id", `${todo.id}-delete`);
  editBtn.appendChild(editBtnIcon);
  todoElement.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.setAttribute("type", "button");
  deleteBtn.setAttribute("class", "delete");
  deleteBtn.setAttribute("id", `${todo.id}-delete`);

  const deleteBtnIcon = document.createElement("i");
  deleteBtnIcon.setAttribute("class", "fa-solid fa-trash");
  deleteBtnIcon.setAttribute("id", `${todo.id}-delete`);
  deleteBtn.appendChild(deleteBtnIcon);
  todoElement.appendChild(deleteBtn);

  todoList.appendChild(todoElement);
}

window.addEventListener("load", (event) => {
  for (const todo of todos) {
    populateTodoList(todo);
  }
});

todoList.addEventListener("click", (event) => {
  console.log(event);
  const { id } = event.target;
  const data = id.split("-");
  const todoId = data[0];
  const btnName = data[1];
  console.log(data, todoId, btnName);

  if (btnName === "delete") {
    const todoElement = document.querySelector(`#todo-element-${todoId}`);
    todoList.removeChild(todoElement);
  }
});

const addTasksDialog = document.querySelector("#add-tasks-dialog");
const addTasksForm = document.querySelector("#add-tasks-form");
const addBtn = document.querySelector("#add-tasks-btn");
// const createBtn = document.querySelector("#create-task-btn");
const closeBtn = document.querySelector("#cancel-btn");
addBtn.addEventListener("click", () => {
  addTasksDialog.showModal();
});
closeBtn.addEventListener("click", () => {
  addTasksDialog.close();
});
// createBtn.addEventListener("click", (event) => {
//   console.log(event);
//   // addTasksDialog.close();
// });
addTasksForm.addEventListener("submit", (event) => {
  event.preventDefault(); // Prevents default form submission

  const formData = new FormData(addTasksForm);
  const data = Object.fromEntries(formData.entries());
  data.created_at = new Date();
  data.updated_at = new Date();

  const lastTodo = todos.slice(-1);
  const lastTodoID = lastTodo[0].id;
  data.id = lastTodoID + 1;
  todos.push(data);

  populateTodoList(data);

  addTasksDialog.close();
});
