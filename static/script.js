let currentFix = '';
let currentReviewData = { critical: [], warning: [], info: [] };
let allHistory = [];
let isDark = true;

async function reviewCode() {
    const code = document.getElementById('code-input').value;
    const language = document.getElementById('language').value;
    const fileInput = document.getElementById('file-input');
    const btn = document.getElementById('review-btn');
    const loader = document.getElementById('loader');

    if (!code.trim() && fileInput.files.length === 0) {
        alert('Please paste code or upload a file first!');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;margin:0"></div> Analyzing...';
    loader.classList.remove('hidden');

    document.getElementById('review-output').innerHTML = '';
    document.getElementById('fix-output').innerHTML = '';
    document.getElementById('diff-output').innerHTML = '';
    document.getElementById('severity-bar').style.display = 'none';
    document.getElementById('complexity-card').style.display = 'none';

    const formData = new FormData();
    formData.append('language', language);

    if (fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
    } else {
        formData.append('code', code);
    }

    try {
        const response = await fetch('/review', { method: 'POST', body: formData });
        const data = await response.json();
        loader.classList.add('hidden');

        if (data.error) {
            document.getElementById('review-output').innerHTML = `<p class="error-msg">${data.error}</p>`;
        } else {
            parseAndRenderReview(data.review);
            document.getElementById('fix-output').innerHTML = marked.parse(data.fix);
            document.getElementById('fix-lang-label').textContent = data.language;
            currentFix = data.fix;
            analyzeComplexity(code);
            buildDiff(code, data.fix);
            hljs.highlightAll();
            switchTab('review');
        }
    } catch (err) {
        loader.classList.add('hidden');
        document.getElementById('review-output').innerHTML = '<p class="error-msg">Cannot connect to server. Is Ollama running?</p>';
    }

    btn.disabled = false;
    btn.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/1534/1534996.png" width="18" height="18" alt="review"> Review + Fix';
}

function parseAndRenderReview(reviewText) {
    const critical = [];
    const warning = [];
    const info = [];

    const sections = reviewText.split(/###\s*(CRITICAL|WARNING|INFO|SUMMARY)/i);

    for (let i = 1; i < sections.length; i += 2) {
        const type = sections[i].trim().toLowerCase();
        const content = sections[i + 1] || '';
        const lines = content.split('\n').map(l => l.trim()).filter(l => l && l !== 'None found.' && !l.startsWith('#'));

        lines.forEach(line => {
            if (line.startsWith('-')) line = line.slice(1).trim();
            if (type === 'critical') critical.push(line);
            else if (type === 'warning') warning.push(line);
            else if (type === 'info') info.push(line);
        });
    }

    currentReviewData = { critical, warning, info, raw: reviewText };

    document.getElementById('sev-critical-count').textContent = critical.length;
    document.getElementById('sev-warning-count').textContent = warning.length;
    document.getElementById('sev-info-count').textContent = info.length;
    document.getElementById('severity-bar').style.display = 'flex';

    renderIssues('all');
}

function renderIssues(filter) {
    const { critical, warning, info, raw } = currentReviewData;
    const output = document.getElementById('review-output');

    if (filter === 'all') {
        output.innerHTML = marked.parse(raw);
        return;
    }

    let items = [];
    if (filter === 'critical') items = critical;
    else if (filter === 'warning') items = warning;
    else if (filter === 'info') items = info;

    if (items.length === 0) {
        output.innerHTML = `<div class="empty-state" style="opacity:0.5"><p>No ${filter} issues found.</p></div>`;
        return;
    }

    output.innerHTML = items.map(item => {
        const lineMatch = item.match(/LINE\s*(\d+)/i);
        const lineTag = lineMatch ? `<span class="line-tag">Line ${lineMatch[1]}</span>` : '';
        const cleanItem = item.replace(/LINE\s*\d+:\s*/i, '');
        return `<div class="issue-item ${filter}">${lineTag}${cleanItem}</div>`;
    }).join('');
}

function filterSeverity(type) {
    document.querySelectorAll('.sev').forEach(b => b.classList.remove('active-sev'));
    event.currentTarget.classList.add('active-sev');
    renderIssues(type);
}

function analyzeComplexity(code) {
    const lines = code.split('\n').length;
    const conditions = (code.match(/if|else|for|while|switch|catch/g) || []).length;
    const score = Math.min(10, Math.round((conditions / Math.max(lines, 1)) * 100 + conditions * 0.5));
    const label = score <= 3 ? 'Low' : score <= 6 ? 'Medium' : 'High';
    document.getElementById('complexity-score').textContent = label;
    document.getElementById('complexity-card').style.display = 'flex';
}

function buildDiff(original, fixed) {
    const origLines = original.split('\n');
    const fixedText = fixed.replace(/```[\w]*\n?/g, '').trim();
    const fixedLines = fixedText.split('\n');

    let html = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">';
    html += '<div><div style="font-size:11px; color:var(--text3); margin-bottom:8px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Original</div>';
    origLines.forEach((line, i) => {
        const cls = fixedLines[i] !== line ? 'diff-remove' : 'diff-same';
        html += `<span class="${cls}">${escapeHtml(line) || ' '}</span>`;
    });
    html += '</div><div><div style="font-size:11px; color:var(--text3); margin-bottom:8px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Fixed</div>';
    fixedLines.forEach((line, i) => {
        const cls = origLines[i] !== line ? 'diff-add' : 'diff-same';
        html += `<span class="${cls}">${escapeHtml(line) || ' '}</span>`;
    });
    html += '</div></div>';

    document.getElementById('diff-output').innerHTML = html;
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function updateStats() {
    const code = document.getElementById('code-input').value;
    document.getElementById('line-count').textContent = code ? code.split('\n').length : 0;
    document.getElementById('word-count').textContent = code ? code.trim().split(/\s+/).filter(Boolean).length : 0;
    document.getElementById('char-count').textContent = code.length;
}

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.output-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('panel-' + tab).classList.add('active');
}

function showSection(name, btn) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');
    if (btn) btn.classList.add('active');
    if (name === 'history') loadHistory();
}

async function loadHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '<p style="color:var(--text3); font-size:13px;">Loading...</p>';
    const res = await fetch('/history');
    allHistory = await res.json();
    renderHistory(allHistory);
}

function renderHistory(data) {
    const list = document.getElementById('history-list');
    if (data.length === 0) {
        list.innerHTML = '<p style="color:var(--text3); font-size:13px;">No history found.</p>';
        return;
    }
    list.innerHTML = data.map(item => `
        <div class="history-item" id="item-${item.id}">
            <div class="history-top">
                <div>
                    <span class="history-title">${item.filename}</span>
                    <span class="lang-badge">${item.language}</span>
                </div>
                <div class="history-actions">
                    <button class="btn-load" onclick="loadReview(${item.id})">Load</button>
                    <button class="btn-delete" onclick="deleteReview(${item.id})">Delete</button>
                </div>
            </div>
            <div class="history-meta">${item.created_at}</div>
        </div>
    `).join('');
}

function filterHistory() {
    const search = document.getElementById('history-search').value.toLowerCase();
    const lang = document.getElementById('history-lang-filter').value;
    const filtered = allHistory.filter(item => {
        return item.filename.toLowerCase().includes(search) && (lang === '' || item.language === lang);
    });
    renderHistory(filtered);
}

async function deleteReview(id) {
    await fetch('/history/' + id, { method: 'DELETE' });
    allHistory = allHistory.filter(item => item.id !== id);
    renderHistory(allHistory);
}

async function loadReview(id) {
    const item = allHistory.find(r => r.id === id);
    if (!item) return;
    showSection('reviewer', document.querySelectorAll('.nav-btn')[0]);
    document.getElementById('code-input').value = item.code;
    parseAndRenderReview(item.review);
    document.getElementById('fix-output').innerHTML = marked.parse(item.fix);
    document.getElementById('fix-lang-label').textContent = item.language;
    currentFix = item.fix;
    updateStats();
    hljs.highlightAll();
}

function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('code-input').value = e.target.result;
        document.getElementById('upload-status').innerHTML = `<span class="upload-status-ok">Loaded: ${file.name}</span>`;
        updateStats();
    };
    reader.readAsText(file);
}

function copyFix() {
    if (!currentFix) return;
    navigator.clipboard.writeText(currentFix).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.innerHTML = 'Copied!';
        setTimeout(() => btn.innerHTML = '<img src="https://cdn-icons-png.flaticon.com/512/1621/1621635.png" width="14" height="14" alt="copy"> Copy', 2000);
    });
}

function clearAll() {
    document.getElementById('code-input').value = '';
    document.getElementById('file-input').value = '';
    document.getElementById('review-output').innerHTML = '<div class="empty-state"><img src="https://cdn-icons-png.flaticon.com/512/1250/1250615.png" width="48" height="48" alt="empty"><p>Paste your code and click Review</p></div>';
    document.getElementById('fix-output').innerHTML = '<div class="empty-state"><img src="https://cdn-icons-png.flaticon.com/512/1163/1163497.png" width="48" height="48" alt="empty"><p>Fixed code will appear here</p></div>';
    document.getElementById('diff-output').innerHTML = '<div class="empty-state"><img src="https://cdn-icons-png.flaticon.com/512/748/748113.png" width="48" height="48" alt="diff"><p>Original vs Fixed diff will appear here</p></div>';
    document.getElementById('upload-status').innerHTML = '';
    document.getElementById('severity-bar').style.display = 'none';
    document.getElementById('complexity-card').style.display = 'none';
    updateStats();
    currentFix = '';
    currentReviewData = { critical: [], warning: [], info: [] };
}

function toggleTheme() {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-icon').src = isDark
        ? 'https://cdn-icons-png.flaticon.com/512/547/547433.png'
        : 'https://cdn-icons-png.flaticon.com/512/169/169367.png';
    document.getElementById('code-theme').href = isDark
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
}

const uploadArea = document.getElementById('upload-area');
uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
        document.getElementById('file-input').files = e.dataTransfer.files;
        handleFileUpload(document.getElementById('file-input'));
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

function closeModal() {
    const modal = document.getElementById('sev-modal');
    if (modal) modal.classList.add('hidden');
}