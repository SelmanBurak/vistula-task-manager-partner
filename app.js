"use strict";

const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const descriptionInput = document.getElementById("task-description");
const submitButton = document.getElementById("task-submit");
const cancelEditButton = document.getElementById("cancel-edit");
const taskList = document.getElementById("task-list");
const statusMessage = document.getElementById("status-message");
const refreshButton = document.getElementById("refresh-tasks");

let config;
let editingTaskId = null;

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

async function loadConfig() {
  const response = await fetch("config.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load config.json.");
  config = await response.json();

  if (!config.supabaseUrl || !config.supabasePublishableKey || config.tableName !== "tasks") {
    throw new Error("Please add the Supabase URL and publishable key to config.json.");
  }
  if (config.supabaseUrl.includes("YOUR_PROJECT_ID") || config.supabasePublishableKey.includes("YOUR_PUBLIC")) {
    throw new Error("Supabase is not configured yet. Add your project URL and publishable key to config.json.");
  }
}

function apiUrl(query = "") {
  const baseUrl = config.supabaseUrl.replace(/\/$/, "");
  return `${baseUrl}/rest/v1/${encodeURIComponent(config.tableName)}${query}`;
}

async function apiRequest(query, options = {}) {
  const response = await fetch(apiUrl(query), {
    ...options,
    headers: {
      apikey: config.supabasePublishableKey,
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Request failed with status ${response.status}.`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function makeButton(label, action, className = "button-secondary") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function renderTasks(tasks) {
  taskList.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No tasks yet. Add your first task above.";
    taskList.append(empty);
    return;
  }

  for (const task of tasks) {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " is-completed" : ""}`;
    item.dataset.id = String(task.id);

    const topLine = document.createElement("div");
    topLine.className = "task-topline";
    const textGroup = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = task.title;
    const description = document.createElement("p");
    description.textContent = task.description || "No description";
    textGroup.append(title, description);

    const badge = document.createElement("span");
    badge.className = "task-status";
    badge.textContent = task.completed ? "Completed" : "Incomplete";
    topLine.append(textGroup, badge);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(
      makeButton(task.completed ? "Mark incomplete" : "Mark complete", () => toggleTask(task)),
      makeButton("Edit", () => beginEdit(task)),
      makeButton("Delete", () => deleteTask(task.id), "delete-button")
    );
    item.append(topLine, actions);
    taskList.append(item);
  }
}

async function loadTasks() {
  try {
    showStatus("Loading tasks...");
    const tasks = await apiRequest("?select=id,title,description,completed&order=id.asc");
    renderTasks(tasks);
    showStatus("");
  } catch (error) {
    showStatus(`Could not load tasks: ${error.message}`, true);
    taskList.replaceChildren();
  }
}

function resetForm() {
  editingTaskId = null;
  form.reset();
  submitButton.textContent = "Add task";
  cancelEditButton.hidden = true;
}

function beginEdit(task) {
  editingTaskId = task.id;
  titleInput.value = task.title;
  descriptionInput.value = task.description || "";
  submitButton.textContent = "Save changes";
  cancelEditButton.hidden = false;
  titleInput.focus();
  document.getElementById("form-heading").textContent = "Edit task";
}

async function toggleTask(task) {
  try {
    await apiRequest(`?id=eq.${encodeURIComponent(task.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ completed: !task.completed })
    });
    showStatus("Task status updated.");
    await loadTasks();
  } catch (error) {
    showStatus(`Could not update task: ${error.message}`, true);
  }
}

async function deleteTask(id) {
  if (!window.confirm("Delete this task?")) return;
  try {
    await apiRequest(`?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" }
    });
    showStatus("Task deleted.");
    await loadTasks();
  } catch (error) {
    showStatus(`Could not delete task: ${error.message}`, true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const task = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    completed: false
  };
  if (!task.title) {
    showStatus("Please enter a task title.", true);
    return;
  }

  try {
    if (editingTaskId === null) {
      await apiRequest("", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(task)
      });
      showStatus("Task added.");
    } else {
      delete task.completed;
      await apiRequest(`?id=eq.${encodeURIComponent(editingTaskId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(task)
      });
      showStatus("Task updated.");
      document.getElementById("form-heading").textContent = "Add a task";
    }
    resetForm();
    await loadTasks();
  } catch (error) {
    showStatus(`Could not save task: ${error.message}`, true);
  }
});

cancelEditButton.addEventListener("click", () => {
  resetForm();
  document.getElementById("form-heading").textContent = "Add a task";
  showStatus("Edit cancelled.");
});
refreshButton.addEventListener("click", loadTasks);

(async function initialize() {
  try {
    await loadConfig();
    await loadTasks();
  } catch (error) {
    showStatus(error.message, true);
  }
})();

