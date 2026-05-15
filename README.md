# 🔍 DevInspect AI

### Intelligent AI-Powered Code Review Assistant

![Python](https://img.shields.io/badge/Python-3.10-blue?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-Backend-black?style=for-the-badge&logo=flask)
![Ollama](https://img.shields.io/badge/Ollama-AI_Engine-green?style=for-the-badge)
![SQLite](https://img.shields.io/badge/SQLite-Database-lightgrey?style=for-the-badge&logo=sqlite)
![AI Powered](https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge)
![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

DevInspect AI is an AI-powered code review tool built with Python, Flask, and Ollama.  
It helps developers analyze code, detect issues, and generate improved code suggestions through an interactive web interface.

---

# ✨ Features

- 🔍 AI-powered code analysis
- 🐞 Detects bugs and code issues
- 🔧 Generates improved code suggestions
- 📂 Upload files or paste code directly
- 📊 Live code metrics and complexity analysis
- 🕘 Review history using SQLite
- 🌙 Dark and Light mode support
- ⚡ Fast AI responses using Ollama

---

# 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| Python | Backend |
| Flask | Web Framework |
| SQLite | Database |
| Ollama | AI Engine |
| HTML/CSS/JavaScript | Frontend |

---

🚀 Setup Guide
1️⃣ Install Ollama

Download from:
https://ollama.com

2️⃣ Pull AI Model
ollama pull llama3.2
3️⃣ Install Dependencies
pip install flask requests
4️⃣ Run the Project

Open two terminals:

Terminal 1
ollama serve
Terminal 2
python app.py
5️⃣ Open in Browser
http://127.0.0.1:5000
📂 Project Structure
devinspect-ai/
│
├── app.py
├── database.py
├── uploads/
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── script.js
⚙️ Model Configuration

To change the AI model, edit:

MODEL = "llama3.2"

Supported models:

llama3.2
mistral
codellama
📌 Future Improvements
GitHub integration
Export review reports
More language support
VS Code extension
Better UI animations
🤝 Contributing

Contributions and suggestions are welcome.

Feel free to fork the project and submit pull requests.

📜 License

MIT License

💻 About

DevInspect AI is a smart AI-assisted code review tool built with Flask and Ollama. It helps developers analyze, debug, and improve code efficiently.