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
  const month = document.getElementById("month").value;
  const day = document.getElementById("day").value;
  const time = document.getElementById("time").value;
  const location = document.getElementById("location").value.trim();
  const color = document.getElementById("color").value;
  if (title === "") {
    showError("タイトルを入力してください");
    return;
  }

if (month === "" || day === "") {
    showError("月と日を入力してください");
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
          month,
          day,
          time,
          location,
          color,
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
          month: task.month,
          day: task.day,
          time: task.time,
          location: task.location,
          color: task.color,
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

  const taskList = document.getElementById("task-list-task");
  const eventList = document.getElementById("task-list-event");

  taskList.innerHTML = "";
  eventList.innerHTML = "";

  const sortOrder = document.getElementById("sort-order").value;

  tasks.sort((a, b) => {

    // 未完了を上にする
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }

    // 月日で並び替え
    const dateA = a.month * 100 + a.day;
    const dateB = b.month * 100 + b.day;

    return sortOrder === "asc"
      ? dateA - dateB
      : dateB - dateA;

  });

  tasks.forEach((task) => {

    const li = document.createElement("li");
    li.className = "todo-item";

    // タスクごとの色
    li.style.borderLeft =
      `8px solid ${task.color || "#2563eb"}`;

    if (task.done) {
      li.classList.add("done");
    }

    const label = document.createElement("label");
    label.className = "todo-label";

    // チェックボックス
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = task.done;

    checkbox.addEventListener(
      "change",
      () => toggleTask(task)
    );

    // タイトル
    const text = document.createElement("span");
    text.className = "todo-title";

    text.textContent =
      `[${task.category}] ${task.title}` +
      (task.subject ? `（${task.subject}）` : "") +
      `　${task.month}/${task.day}` +
      (task.time ? ` ${task.time}` : "");

    label.appendChild(checkbox);
    label.appendChild(text);

    // Google Maps
    if (task.location) {

      const mapLink = document.createElement("a");

      mapLink.href =
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`;

      mapLink.target = "_blank";
      mapLink.rel = "noopener noreferrer";

      mapLink.textContent =
        `📍 ${task.location}`;

      label.appendChild(mapLink);
    }

    // 削除ボタン
    const deleteBtn = document.createElement("button");

    deleteBtn.className = "delete-button";
    deleteBtn.textContent = "削除";

    deleteBtn.addEventListener(
      "click",
      () => deleteTask(task.id)
    );

    li.appendChild(label);
    li.appendChild(deleteBtn);

    // 課題と予定を分ける
    if (task.category === "課題") {
      taskList.appendChild(li);
    } else {
      eventList.appendChild(li);
    }

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
document.getElementById("sort-order").addEventListener("change", loadTasks);

// 最初に一覧を表示
loadTasks();