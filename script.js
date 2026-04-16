const habitList = document.getElementById('habit-list');
const addBtn = document.getElementById('add-habit');
const clearBtn = document.getElementById('clear-data');
const exportBtn = document.getElementById('export-data'); 
const themeToggleBtn = document.getElementById('theme-toggle'); 

const modal = document.getElementById('add-modal');
const confirmAddBtn = document.getElementById('confirm-add');
const cancelAddBtn = document.getElementById('cancel-add');
const nameInput = document.getElementById('habit-name-input');
const deadlineInput = document.getElementById('habit-deadline-input');

const palette = ['#4ade80', '#f97316', '#ec4899', '#eab308', '#3b82f6', '#a855f7', '#06b6d4'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function applyTheme() {
    const savedTheme = localStorage.getItem('habitAppTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggleBtn.textContent = '🌙'; 
    } else {
        document.body.classList.remove('light-theme');
        themeToggleBtn.textContent = '☀️'; 
    }
}
applyTheme();

themeToggleBtn.addEventListener('click', () => {
    localStorage.setItem('habitAppTheme', document.body.classList.contains('light-theme') ? 'dark' : 'light');
    applyTheme();
});

function getDateFromDayIndex(dayIndex, creationISO) {
    const date = new Date(creationISO);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function calculateDaysBetween(startISO, endISO) {
    const start = new Date(startISO);
    const end = new Date(endISO);
    start.setHours(0, 0, 0, 0); 
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function saveHabits() {
    const habits = [];
    const cards = document.querySelectorAll('.habit-card');
    cards.forEach(card => {
        const title = card.querySelector('.habit-title').textContent;
        const color = card.style.getPropertyValue('--habit-color');
        const deadline = card.getAttribute('data-deadline');
        const creationDate = card.getAttribute('data-created');
        const totalSquares = parseInt(card.getAttribute('data-total'), 10);
        
        const squares = Array.from(card.querySelectorAll('.square')).map(sq => 
            sq.classList.contains('completed')
        );
        
        const subGoals = card.habitData.subGoals;
        const notes = card.habitData.notes;

        habits.push({ title, squares, color, deadline, creationDate, totalSquares, subGoals, notes });
    });
    localStorage.setItem('habitAppData', JSON.stringify(habits));
}

function addNewHabit(title, savedSquares = null, savedColor = null, deadline = null, savedCreationDate = null, savedTotalSquares = null, savedSubGoals = [], savedNotes = []) {
    const card = document.createElement('section');
    card.classList.add('habit-card');
    
    card.habitData = {
        subGoals: savedSubGoals || [],
        notes: savedNotes || []
    };
    
    const createdOn = savedCreationDate || new Date().toISOString();
    let totalSquares = savedTotalSquares;
    
    if (!totalSquares) {
        if (deadline) {
            const diff = calculateDaysBetween(createdOn, deadline);
            totalSquares = diff > 0 ? diff : 1; 
        } else {
            totalSquares = 365; 
        }
    }

    card.setAttribute('data-deadline', deadline || '');
    card.setAttribute('data-created', createdOn);
    card.setAttribute('data-total', totalSquares);

    const existingCount = document.querySelectorAll('.habit-card').length;
    const themeColor = savedColor || palette[existingCount % palette.length];
    card.style.setProperty('--habit-color', themeColor);

    let deadlineBadgeHtml = '';
    if (deadline) {
        const daysLeft = calculateDaysBetween(new Date().toISOString(), deadline);
        let text = daysLeft > 0 ? `${daysLeft} Days Left` : (daysLeft === 0 ? "Deadline Today!" : "Past Deadline");
        deadlineBadgeHtml = `<span class="deadline-badge">⏳ ${text}</span>`;
    }

    card.innerHTML = `
        <div class="card-top">
            <div class="card-main">
                <div class="habit-header">
                    <div class="habit-info">
                        <h2 class="habit-title">${title}</h2>
                        <span class="streak-count">🔥 <span class="streak-val">0</span> Day Streak</span>
                        ${deadlineBadgeHtml}
                    </div>
                    <div class="card-controls">
                        <button class="icon-btn details-btn" title="Toggle Details">📋</button>
                        <button class="icon-btn analytics-btn" title="Toggle Graph">📊</button>
                        <button class="icon-btn delete-btn" title="Delete Habit">×</button>
                    </div>
                </div>
                <div class="habit-grid"></div>
            </div>
            <div class="card-stats">
                <svg class="progress-ring" viewBox="0 0 90 90">
                    <circle class="progress-ring-circle-bg" cx="45" cy="45" r="40"></circle>
                    <circle class="progress-ring-circle" cx="45" cy="45" r="40"></circle>
                    <text x="50%" y="50%" text-anchor="middle" dy=".3em" class="percentage-text">0%</text>
                </svg>
            </div>
        </div>
        <div class="chart-container">
            <canvas class="progressChart"></canvas>
        </div>
        <div class="details-panel">
            <div class="panel-section">
                <h4>🎯 Milestones</h4>
                <ul class="item-list sub-goals-list"></ul>
                <div class="add-input-group">
                    <input type="text" class="sub-goal-input" placeholder="e.g., Run 5km under 25 mins">
                    <button class="add-btn add-sub-goal-btn">+</button>
                </div>
            </div>
            <div class="panel-section">
                <h4>📝 Log & Notes</h4>
                <ul class="item-list notes-list"></ul>
                <div class="add-input-group">
                    <input type="text" class="note-input" placeholder="e.g., Felt great today!">
                    <button class="add-btn add-note-btn">+</button>
                </div>
            </div>
        </div>
    `;

    const grid = card.querySelector('.habit-grid');
    const streakDisplay = card.querySelector('.streak-val');
    const progressCircle = card.querySelector('.progress-ring-circle');
    const percentText = card.querySelector('.percentage-text');
    
    const detailsBtn = card.querySelector('.details-btn');
    const detailsPanel = card.querySelector('.details-panel');
    const analyticsBtn = card.querySelector('.analytics-btn');
    const chartContainer = card.querySelector('.chart-container');
    const deleteBtn = card.querySelector('.delete-btn');

    const subGoalInput = card.querySelector('.sub-goal-input');
    const addSubGoalBtn = card.querySelector('.add-sub-goal-btn');
    const noteInput = card.querySelector('.note-input');
    const addNoteBtn = card.querySelector('.add-note-btn');

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;

    for (let i = 0; i < totalSquares; i++) {
        const square = document.createElement('div');
        square.classList.add('square');
        square.title = getDateFromDayIndex(i, createdOn); 

        if (savedSquares && savedSquares[i]) {
            square.classList.add('completed');
        }

        square.addEventListener('click', () => {
            square.classList.toggle('completed');
            updateCardStats(grid, streakDisplay, progressCircle, percentText, circumference, totalSquares);
            updateChartData(grid, chartInstance, createdOn);
            saveHabits();
        });

        grid.appendChild(square);
    }

    const canvas = card.querySelector('.progressChart');
    const ctx = canvas.getContext('2d');
    let chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthNames,
            datasets: [{
                label: 'Days Completed',
                data: Array(12).fill(0),
                backgroundColor: themeColor,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { color: '#94a3b8' } }, x: { ticks: { color: '#94a3b8' } } },
            plugins: { legend: { display: false } }
        }
    });

    function renderSubGoals() {
        const list = card.querySelector('.sub-goals-list');
        list.innerHTML = '';
        card.habitData.subGoals.forEach((sg, i) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="checkbox" ${sg.completed ? 'checked' : ''} class="sg-check" data-index="${i}">
                <span class="${sg.completed ? 'completed-text' : ''}">${sg.text}</span>
                <button class="delete-item-btn" data-index="${i}">×</button>
            `;
            list.appendChild(li);
        });

        list.querySelectorAll('.sg-check').forEach(chk => {
            chk.addEventListener('change', (e) => {
                card.habitData.subGoals[e.target.dataset.index].completed = e.target.checked;
                renderSubGoals();
                saveHabits();
            });
        });

        list.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                card.habitData.subGoals.splice(e.target.dataset.index, 1);
                renderSubGoals();
                saveHabits();
            });
        });
    }

    function renderNotes() {
        const list = card.querySelector('.notes-list');
        list.innerHTML = '';
        card.habitData.notes.forEach((note, i) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="note-content">
                    <span class="note-date">${note.date}</span>
                    <span>${note.text}</span>
                </div>
                <button class="delete-item-btn" data-index="${i}">×</button>
            `;
            list.appendChild(li);
        });

        list.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                card.habitData.notes.splice(e.target.dataset.index, 1);
                renderNotes();
                saveHabits();
            });
        });
    }

    addSubGoalBtn.addEventListener('click', () => {
        const text = subGoalInput.value.trim();
        if (text) {
            card.habitData.subGoals.push({ text: text, completed: false });
            subGoalInput.value = '';
            renderSubGoals();
            saveHabits();
        }
    });

    addNoteBtn.addEventListener('click', () => {
        const text = noteInput.value.trim();
        if (text) {
            const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            card.habitData.notes.push({ text: text, date: todayStr });
            noteInput.value = '';
            renderNotes();
            saveHabits();
        }
    });

    detailsBtn.addEventListener('click', () => { detailsPanel.classList.toggle('active'); });
    analyticsBtn.addEventListener('click', () => { chartContainer.classList.toggle('active'); });
    deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete the habit "${title}"?`)) { card.remove(); saveHabits(); }
    });

    habitList.appendChild(card);
    
    renderSubGoals();
    renderNotes();
    updateCardStats(grid, streakDisplay, progressCircle, percentText, circumference, totalSquares);
    updateChartData(grid, chartInstance, createdOn);
}

function updateCardStats(gridElement, streakDisplay, circle, text, circumference, totalSquares) {
    const allSquares = gridElement.querySelectorAll('.square');
    const completedCount = gridElement.querySelectorAll('.square.completed').length;
    
    const percentage = Math.round((completedCount / totalSquares) * 100);
    text.textContent = `${percentage}%`;
    circle.style.strokeDashoffset = circumference - (percentage / 100) * circumference;

    let lastCompletedIndex = -1;
    for (let i = allSquares.length - 1; i >= 0; i--) {
        if (allSquares[i].classList.contains('completed')) {
            lastCompletedIndex = i;
            break;
        }
    }

    if (lastCompletedIndex === -1) { streakDisplay.textContent = 0; return; }

    let currentStreak = 0;
    for (let i = lastCompletedIndex; i >= 0; i--) {
        if (allSquares[i].classList.contains('completed')) { currentStreak++; } else { break; }
    }
    streakDisplay.textContent = currentStreak;
}

function updateChartData(gridElement, chart, createdOn) {
    const allSquares = gridElement.querySelectorAll('.square');
    const monthlyData = new Array(12).fill(0);
    
    allSquares.forEach((square, index) => {
        if (square.classList.contains('completed')) {
            const date = new Date(createdOn);
            date.setDate(date.getDate() + index);
            const monthIndex = date.getMonth(); 
            monthlyData[monthIndex]++;
        }
    });
    
    chart.data.datasets[0].data = monthlyData;
    chart.update();
}

function exportToCSV() {
    const rawData = localStorage.getItem('habitAppData');
    if (!rawData || JSON.parse(rawData).length === 0) { alert("No habit data to export!"); return; }
    const habits = JSON.parse(rawData);
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Habit Name,Target Deadline,Total Days Required,Days Completed,Progress (%)\n";
    
    habits.forEach(h => {
        const completedCount = h.squares.filter(Boolean).length;
        const percentage = Math.round((completedCount / h.totalSquares) * 100);
        const deadlineStr = h.deadline ? h.deadline : "None";
        csvContent += `"${h.title}","${deadlineStr}",${h.totalSquares},${completedCount},${percentage}%\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "habit_tracker_data.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

exportBtn.addEventListener('click', exportToCSV);

clearBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all habits?")) {
        localStorage.removeItem('habitAppData');
        location.reload();
    }
});

addBtn.addEventListener('click', () => { modal.classList.remove('hidden'); });

cancelAddBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    nameInput.value = ''; 
    deadlineInput.value = ''; 
});

confirmAddBtn.addEventListener('click', () => {
    const habitName = nameInput.value.trim();
    const habitDeadline = deadlineInput.value;
    
    if (habitName) {
        addNewHabit(habitName, null, null, habitDeadline);
        saveHabits();
        modal.classList.add('hidden');
        nameInput.value = '';
        deadlineInput.value = '';
    } else {
        alert("Please enter a habit name.");
    }
});

function initApp() {
    const rawData = localStorage.getItem('habitAppData');
    if (rawData && JSON.parse(rawData).length > 0) {
        const savedHabits = JSON.parse(rawData);
        savedHabits.forEach(h => addNewHabit(h.title, h.squares, h.color, h.deadline, h.creationDate, h.totalSquares, h.subGoals, h.notes));
    } else {
        modal.classList.remove('hidden');
    }
}

initApp();