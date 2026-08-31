"""
TODOアプリ バックエンド - 完成版
第8回: セキュリティの基礎 & 総仕上げ
"""

import sqlite3  # Python標準のデータベース（SQLite）を使うためのライブラリ
import uvicorn  # FastAPIアプリを動かすためのWebサーバー

from fastapi import FastAPI, HTTPException  # Webアプリ本体とエラー応答用
from fastapi.middleware.cors import CORSMiddleware  # ブラウザからのアクセスを許可する設定
from fastapi.staticfiles import StaticFiles  # HTML/CSS/JSなどのファイルを配信する機能
from pydantic import BaseModel, Field  # 受け取るデータの形をチェックする道具

# --- FastAPIアプリ ---
# このappが、Webアプリ全体の本体になる
app = FastAPI(title="Task Schedule")

# CORS設定: 別のアドレスで動くフロント（ブラウザの画面）からの通信を許可する
# allow_origins=["*"] は「どこからのアクセスでもOK」という意味（学習用の設定）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- データベース設定 ---
# データを保存するファイルの名前。アプリと同じフォルダに todo.db が作られる
DATABASE = "Task Schedule.db"


def init_db():
    """データベースとテーブルを初期化する"""
    conn = sqlite3.connect(DATABASE)  # データベースに接続する
    cursor = conn.cursor()  # SQLを実行する係（カーソル）を用意する
    # todos テーブルがまだ無ければ作る（IF NOT EXISTS）
    #   id    : 自動で増える番号（主キー）
    #   title : TODOの内容（空はNG）
    #   done  : 完了したかどうか（0=未完了, 1=完了）
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        subject TEXT,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        time TEXT,
        location TEXT,
        color TEXT DEFAULT '#2563eb',
        done INTEGER DEFAULT 0
)    """)
    conn.commit()  # 変更を確定して保存する
    conn.close()  # 接続を閉じる


# --- Pydanticモデル ---
# APIが受け取るデータの「形」を決めるクラス。
# 形に合わないデータが送られてきたら、FastAPIが自動でエラーを返してくれる。


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    category: str
    subject: str | None = None
    month: int
    day: int
    time: str | None = None
    location: str | None = None
    color: str = "#2563eb"

class TaskUpdate(BaseModel):
    title: str
    category: str
    subject: str | None = None
    month: int
    day: int
    time: str | None = None
    location: str | None = None
    color: str = "#2563eb"
    done: bool
        # --- APIエンドポイント ---
# @app.get / @app.post などの飾り（デコレータ）で、
# 「どのURLに、どの種類のリクエストが来たら、この関数を動かすか」を決める。


@app.get("/tasks")  # GET /tasks にアクセスされたら実行
def get_tasks():
    """課題・予定一覧を取得する"""

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # tasksテーブルの全データを日付・時間順に取得
    cursor.execute("""
    SELECT
        id,
        title,
        category,
        subject,
        month,
        day,
        time,
        location,
        color,
        done
    FROM tasks
    ORDER BY month, day, time
    """)

    rows = cursor.fetchall()

    conn.close()

    return [
        {
            "id": row[0],
            "title": row[1],
            "category": row[2],
            "subject": row[3],
            "month": row[4],
            "day": row[5],
            "time": row[6],
            "location": row[7],
            "color": row[8],
            "done": bool(row[9]),
        }
        for row in rows
    ]
@app.post("/tasks", status_code=201)
def create_task(task: TaskCreate):
    """新しい課題・予定を作成する"""

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO tasks
        (title, category, subject, date, time, done)
        VALUES (?, ?, ?, ?, ?, 0)
        """,
        (
            task.title,
            task.category,
            task.subject,
            task.date,
            task.time,
        ),
    )

    conn.commit()
    task_id = cursor.lastrowid

    conn.close()

    return {
        "id": task_id,
        "title": task.title,
        "category": task.category,
        "subject": task.subject,
        "date": task.date,
        "time": task.time,
        "done": False,
    }


@app.put("/tasks/{task_id}")
def update_task(task_id: int, task: TaskUpdate):
    """課題・予定を更新する"""

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT title FROM tasks WHERE id = ?",
        (task_id,),
    )

    existing = cursor.fetchone()

    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    cursor.execute(
        """
        UPDATE tasks
        SET title = ?, category = ?, subject = ?, date = ?, time = ?, done = ?
        WHERE id = ?
        """,
        (
            task.title,
            task.category,
            task.subject,
            task.date,
            task.time,
            int(task.done),
            task_id,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "id": task_id,
        "title": task.title,
        "category": task.category,
        "subject": task.subject,
        "date": task.date,
        "time": task.time,
        "done": task.done,
    }
@app.delete("/tasks/{task_id}")  # DELETE /tasks/5 で id=5 の課題・予定を削除
def delete_task(task_id: int):
    """課題・予定を削除する"""

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # 削除する前に、その id のデータが存在するか確認する
    cursor.execute("SELECT id FROM tasks WHERE id = ?", (task_id,))
    existing = cursor.fetchone()

    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    # データを削除
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()

    conn.close()

    return {
        "message": "Task deleted",
        "id": task_id
    }


# --- 静的ファイル配信 ---
app.mount("/", StaticFiles(directory="static", html=True), name="static")

# --- アプリ起動時にDBを初期化 ---
init_db()

# サーバー起動
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)