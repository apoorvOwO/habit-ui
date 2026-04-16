const STORE_KEY = 'notesData';
const grid = document.getElementById('notes-grid');

// Theme logic -> copy from script.js
const themeToggle = document.getElementById('theme-toggle');
const randomizeBtn = document.getElementById('randomize-theme-btn');

function applyTheme() {
    const savedTheme = localStorage.getItem('habitAppTheme') || 'dark';
    document.body.classList.remove('light-theme', 'clause-theme');

    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.textContent = '🤖';
    } else if (savedTheme === 'clause') {
        document.body.classList.add('clause-theme');
        themeToggle.textContent = '☀️';
    } else { // dark
        themeToggle.textContent = '🌙';
    }
}
function applyAccentColor() {
    const savedAccent = localStorage.getItem('habitAppAccentColor');
    if (savedAccent) document.documentElement.style.setProperty('--accent-color', savedAccent);
}
applyTheme();
applyAccentColor();

themeToggle.addEventListener('click', () => {
    const current = localStorage.getItem('habitAppTheme') || 'dark';
    const next = current === 'dark' ? 'light' : current === 'light' ? 'clause' : 'dark';
    localStorage.setItem('habitAppTheme', next);
    applyTheme();
});

randomizeBtn.addEventListener('click', () => {
    const newAccent = `hsl(${Math.floor(Math.random() * 360)}, ${70 + Math.floor(Math.random() * 20)}%, ${55 + Math.floor(Math.random() * 10)}%)`;
    document.documentElement.style.setProperty('--accent-color', newAccent);
    localStorage.setItem('habitAppAccentColor', newAccent);
});

const loadData = () => JSON.parse(localStorage.getItem(STORE_KEY)) || [];
const saveData = (data) => {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
};

// CORS Proxy Fetcher -> Extracts OpenGraph metadata
async function fetchLinkPreview(url) {
    try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        const data = await res.json();
        const doc = new DOMParser().parseFromString(data.contents, "text/html");
        
        const title = doc.querySelector('meta[property="og:title"]')?.content || doc.querySelector('title')?.innerText || url;
        const img = doc.querySelector('meta[property="og:image"]')?.content || '';
        
        return { url, title, img };
    } catch { return { url, title: url, img: '' }; }
}

/**
 * Extracts the video ID from various YouTube URL formats.
 * @param {string} url - The YouTube URL.
 * @returns {string|null} The video ID or null if not a valid YouTube URL.
 */
function getYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

async function addNote() {
    const addNoteBtn = document.getElementById('add-note-btn');
    addNoteBtn.disabled = true;
    addNoteBtn.textContent = 'Saving...';

    try {
        const title = document.getElementById('note-title').value;
        const body = document.getElementById('note-body').value;
        const url = document.getElementById('note-url').value;
        
        if (!title && !body && !url) {
            return;
        }

        let preview = null;
        if (url) {
            const videoId = getYouTubeVideoId(url);
            // If it's a YouTube link, create a video preview object.
            if (videoId) {
                preview = { type: 'youtube', videoId: videoId, url: url };
            } else {
                // Otherwise, fetch the standard link preview.
                preview = await fetchLinkPreview(url);
            }
        }

        const notes = loadData();
        notes.unshift({ id: Date.now(), title, body, preview });
        saveData(notes);
        
        document.getElementById('note-title').value = '';
        document.getElementById('note-body').value = '';
        document.getElementById('note-url').value = '';
        
        renderNotes();
    } finally {
        addNoteBtn.disabled = false;
        addNoteBtn.textContent = 'Save Note';
    }
}

function renderNotes() {
    const notes = loadData();
    grid.innerHTML = '';
    notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        
        let html = `<button class="note-delete" onclick="deleteNote(${note.id})">×</button>`;
        if (note.title) html += `<h3>${note.title}</h3>`;
        if (note.body) html += `<p>${note.body}</p>`;
        
        // Check if a preview exists and what type it is.
        if (note.preview) {
            if (note.preview.type === 'youtube') {
                // Render the YouTube iframe if it's a video.
                html += `
                    <div class="note-video-preview">
                        <iframe src="https://www.youtube.com/embed/${note.preview.videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>`;
            } else {
                // Fallback to the standard link preview for other URLs.
                html += `<a href="${note.preview.url}" target="_blank" class="note-link-preview">
                    ${note.preview.img ? `<img src="${note.preview.img}">` : ''}
                    <span>${note.preview.title}</span>
                </a>`;
            }
        }
        card.innerHTML = html;
        grid.appendChild(card);
    });
}

window.deleteNote = (id) => {
    const notes = loadData().filter(n => n.id !== id);
    saveData(notes);
    renderNotes();
};

document.getElementById('add-note-btn').addEventListener('click', addNote);
document.getElementById('clear-notes').addEventListener('click', () => {
    localStorage.removeItem(STORE_KEY);
    renderNotes();
});

renderNotes();