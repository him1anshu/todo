let todos = [
  {
    id: 1,
    display: "Shopping",
    description: "List: Apple, Milk, Spinach.",
    created_at: "19/02/2025, 10:03:12",
    updated_at: "19/02/2025, 10:03:12",
  },
  {
    id: 2,
    display: "Cycling",
    description: "For 10 minutes between 8 A.M. to 10 A.M.",
    created_at: "19/02/2025, 10:05:12",
    updated_at: "19/02/2025, 10:05:12",
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
  viewBtnIcon.setAttribute("id", `${todo.id}-view`);
  viewBtn.appendChild(viewBtnIcon);
  todoElement.appendChild(viewBtn);

  const editBtn = document.createElement("button");
  editBtn.setAttribute("type", "button");
  editBtn.setAttribute("class", "edit");
  editBtn.setAttribute("id", `${todo.id}-edit`);

  const editBtnIcon = document.createElement("i");
  editBtnIcon.setAttribute("class", "fa-solid fa-pen-to-square");
  editBtnIcon.setAttribute("id", `${todo.id}-edit`);
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
  const { id } = event.target;
  const data = id.split("-");
  const todoId = data[0];
  const btnName = data[1];

  if (btnName === "delete") {
    const todoElement = document.querySelector(`#todo-element-${todoId}`);
    todoList.removeChild(todoElement);
  }

  if (btnName === "view") {
    viewTaskDetails(todoId);
  }
});

// Add tasks
const addTasksDialog = document.querySelector("#add-tasks-dialog");
const addBtn = document.querySelector("#add-tasks-btn");
const closeBtn = document.querySelector("#cancel-btn");
addBtn.addEventListener("click", () => {
  addTasksDialog.showModal();
});
closeBtn.addEventListener("click", () => {
  addTasksDialog.close();
});

const addTasksForm = document.querySelector("#add-tasks-form");
addTasksForm.addEventListener("submit", (event) => {
  event.preventDefault(); // Prevents default form submission

  const formData = new FormData(addTasksForm);
  const data = Object.fromEntries(formData.entries());
  data.created_at = new Date().toLocaleString();
  data.updated_at = new Date().toLocaleString();

  const lastTodo = todos.slice(-1);
  const lastTodoID = lastTodo[0].id;
  data.id = lastTodoID + 1;
  todos.push(data);

  populateTodoList(data);

  addTasksForm.reset();

  addTasksDialog.close();
});

// View task details
function viewTaskDetails(id) {
  id = parseInt(id, 10);
  const todo = todos.filter((ele) => {
    return ele.id === id;
  })[0];

  const viewTasksDialog = document.querySelector("#view-tasks-dialog");
  const display = document.querySelector("#view-tasks-dialog #display");
  const description = document.querySelector("#view-tasks-dialog #description");
  const created_at = document.querySelector("#view-tasks-dialog #created_at");
  const updated_at = document.querySelector("#view-tasks-dialog #updated_at");
  display.value = todo.display;
  description.value = todo.description;
  created_at.value = todo.created_at;
  updated_at.value = todo.updated_at;

  viewTasksDialog.showModal();
}
