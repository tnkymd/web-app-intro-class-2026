// サーバー側のAPI
const API_URL = "/tasks";

// ============================================================
// 課題・予定一覧を取得
// ============================================================
async function loadTasks() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "データの取得に失敗しました");
      return;
    }

    const tasks = await response.json();
    renderTasks(tasks);

  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

// ============================================================
// 新しい課題・予定を追加
// ============================================================
async function addTask() {

  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const subject = document.getElementById("subject").value.trim();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;

  if (title === "") {
    showError("タイトルを入力してください");
    return;
  }

  if (date === "") {
    showError("日付を入力してください");
    return;
  }

  try {

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        category,
        subject,
        date,
        time,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "追加に失敗しました");
      return;
    }

    document.getElementById("task-form").reset();

    loadTasks();

  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

// ============================================================
// 完了状態を変更
// ============================================================
async function toggleTask(task) {

  try {

    const response = await fetch(`${API_URL}/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: task.title,
        category: task.category,
        subject: task.subject,
        date: task.date,
        time: task.time,
        done: !task.done,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "更新に失敗しました");
      return;
    }

    loadTasks();

  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

// ============================================================
// 削除
// ============================================================
async function deleteTask(id) {

  try {

    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "削除に失敗しました");
      return;
    }

    loadTasks();

  } catch (error) {
    showError("通信エラーが発生しました");
  }
}
// ============================================================
// 描画
// ============================================================

function renderTasks(tasks) {

  const list = document.getElementById("task-list");
  list.innerHTML = "";

  tasks.forEach((task) => {

    const li = document.createElement("li");
    li.className = "todo-item";

    if (task.done) {
      li.classList.add("done");
    }

    const label = document.createElement("label");
    label.className = "todo-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task));

    const text = document.createElement("span");
    text.className = "todo-title";

    text.textContent =
      `[${task.category}] ${task.title}` +
      (task.subject ? `（${task.subject}）` : "") +
      `　${task.date}` +
      (task.time ? ` ${task.time}` : "");

    label.appendChild(checkbox);
    label.appendChild(text);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-button";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(label);
    li.appendChild(deleteBtn);

    list.appendChild(li);

  });

}

// ============================================================
// エラーメッセージ
// ============================================================

function showError(message) {

  const error = document.getElementById("error-message");

  error.textContent = message;
  error.style.display = "block";

  setTimeout(() => {
    error.style.display = "none";
  }, 5000);

}

// ============================================================
// イベント
// ============================================================

document.getElementById("task-form").addEventListener("submit", function (e) {
  e.preventDefault();
  addTask();

});

// 最初に一覧を表示
loadTasks();