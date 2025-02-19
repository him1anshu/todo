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

function populateTodoList() {
  for (const todo of todos) {
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
}

window.addEventListener("load", (event) => {
  populateTodoList(event);
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
