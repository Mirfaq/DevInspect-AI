from flask import Flask, render_template, request, jsonify
import requests
import os
from database import init_db, save_review, get_history, delete_review

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"

ALLOWED_EXTENSIONS = {'py', 'js', 'java', 'cpp', 'c', 'php', 'sql', 'ts', 'go', 'rb', 'cs'}

os.makedirs('uploads', exist_ok=True)
init_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_language_from_extension(filename):
    ext_map = {
        'py': 'Python', 'js': 'JavaScript', 'java': 'Java',
        'cpp': 'C++', 'c': 'C', 'php': 'PHP', 'sql': 'SQL',
        'ts': 'TypeScript', 'go': 'Go', 'rb': 'Ruby', 'cs': 'C#'
    }
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    return ext_map.get(ext, 'Unknown')

def ask_ollama(prompt):
    response = requests.post(OLLAMA_URL, json={
        "model": MODEL,
        "prompt": prompt,
        "stream": False
    }, timeout=180)
    return response.json()['response']

def review_code(code, language):
    prompt = f"""You are an expert {language} code reviewer. Analyze this code and respond in exactly this format:

## REVIEW

### CRITICAL
List each critical bug or security issue on a new line starting with "LINE X:" where X is the line number if known, or just describe the issue. If none, write "None found."

### WARNING
List each warning or performance issue on a new line starting with "LINE X:" where X is the line number if known. If none, write "None found."

### INFO
List each suggestion or style improvement on a new line starting with "LINE X:" where X is the line number if known. If none, write "None found."

### SUMMARY
Write 2-3 sentences summarizing the overall code quality.

## FIXED CODE
Provide the complete fixed version:

````{language.lower()}
(fixed code here)
````

Code to review:
````{language.lower()}
{code}
```"""

    result = ask_ollama(prompt)

    if "## FIXED CODE" in result:
        parts = result.split("## FIXED CODE")
        review_part = parts[0].replace("## REVIEW", "").strip()
        fix_part = parts[1].strip()
    else:
        review_part = result
        fix_part = "Could not generate fixed code. Please try again."

    return review_part, fix_part

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/review', methods=['POST'])
def review():
    code = ''
    language = request.form.get('language', 'Python')
    filename = 'manual_input'

    if 'file' in request.files and request.files['file'].filename != '':
        file = request.files['file']
        if allowed_file(file.filename):
            filename = file.filename
            language = get_language_from_extension(filename)
            code = file.read().decode('utf-8')
        else:
            return jsonify({"error": "File type not allowed!"}), 400
    else:
        code = request.form.get('code', '')

    if not code.strip():
        return jsonify({"error": "Please paste your code first!"}), 400

    try:
        review_result, fix_result = review_code(code, language)
        save_review(filename, language, code, review_result, fix_result)
        return jsonify({
            "review": review_result,
            "fix": fix_result,
            "language": language
        })
    except Exception as e:
        return jsonify({"error": f"Error: {str(e)}. Is Ollama running?"}), 500

@app.route('/history', methods=['GET'])
def history():
    return jsonify(get_history())

@app.route('/history/<int:review_id>', methods=['DELETE'])
def delete(review_id):
    delete_review(review_id)
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True)
