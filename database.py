import sqlite3
from datetime import datetime

def get_db():
    conn = sqlite3.connect('reviews.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            language TEXT,
            code TEXT,
            review TEXT,
            fix TEXT,
            created_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_review(filename, language, code, review, fix):
    conn = get_db()
    conn.execute('''
        INSERT INTO reviews (filename, language, code, review, fix, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (filename, language, code, review, fix, datetime.now().strftime('%d %b %Y, %I:%M %p')))
    conn.commit()
    conn.close()

def get_history():
    conn = get_db()
    rows = conn.execute('SELECT * FROM reviews ORDER BY id DESC LIMIT 20').fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_review(review_id):
    conn = get_db()
    conn.execute('DELETE FROM reviews WHERE id = ?', (review_id,))
    conn.commit()
    conn.close()
