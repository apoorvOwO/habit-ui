// DOM Element Selections
const habitList = document.getElementById('habit-list');
const addBtn = document.getElementById('add-habit');
const clearBtn = document.getElementById('clear-data');
const exportBtn = document.getElementById('export-data'); 
const themeToggleBtn = document.getElementById('theme-toggle');
const randomizeThemeBtn = document.getElementById('randomize-theme-btn');

const modal = document.getElementById('add-modal');
const confirmAddBtn = document.getElementById('confirm-add');
const cancelAddBtn = document.getElementById('cancel-add');
const nameInput = document.getElementById('habit-name-input');
const deadlineInput = document.getElementById('habit-deadline-input');

// Global Constants & State
const palette = ['#4ade80', '#f97316', '#ec4899', '#eab308', '#3b82f6', '#a855f7', '#06b6d4'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Theme Management
/**
 * Applies the theme (light/dark) based on the value stored in localStorage.
 */
function applyTheme() {
    const savedTheme = localStorage.getItem('habitAppTheme') || 'dark';
    document.body.classList.remove('light-theme', 'clause-theme');

    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggleBtn.textContent = '🤖';
    } else if (savedTheme === 'clause') {
        document.body.classList.add('clause-theme');
        themeToggleBtn.textContent = '☀️';
    } else { // dark
        themeToggleBtn.textContent = '🌙';
    }
}

/**
 * Applies the custom accent color from localStorage.
 */
function applyAccentColor() {
    const savedAccent = localStorage.getItem('habitAppAccentColor');
    if (savedAccent) {
        document.documentElement.style.setProperty('--accent-color', savedAccent);
    }
}

applyTheme();
applyAccentColor();

// Event listener for the theme toggle button.
themeToggleBtn.addEventListener('click', () => {
    const currentTheme = localStorage.getItem('habitAppTheme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : currentTheme === 'light' ? 'clause' : 'dark';
    localStorage.setItem('habitAppTheme', nextTheme);
    applyTheme();
});

// Event listener for the randomize accent color button.
randomizeThemeBtn.addEventListener('click', () => {
    const hue = Math.floor(Math.random() * 360);
    const newAccentColor = `hsl(${hue}, ${70 + Math.floor(Math.random() * 20)}%, ${55 + Math.floor(Math.random() * 10)}%)`;
    
    document.documentElement.style.setProperty('--accent-color', newAccentColor);
    localStorage.setItem('habitAppAccentColor', newAccentColor);
});

// Utility Functions
/**
 * Calculates a full date string from a day index and the habit's creation date.
 * Used for the tooltip on each grid square.
 * @param {number} dayIndex - The 0-based index of the day square.
 * @param {string} creationISO - The ISO string of the habit's creation date.
 */
function getDateFromDayIndex(dayIndex, creationISO) {
    const date = new Date(creationISO);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function calculateDaysBetween(startISO, endISO) {
    /**
     * Calculates the number of days between two ISO date strings.
     * @param {string} startISO - The start date.
     * @param {string} endISO - The end date.
     */
    const start = new Date(startISO);
    const end = new Date(endISO);
    start.setHours(0, 0, 0, 0); 
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

// Data Persistence
/**
 * Gathers all habit data from the DOM and saves it to localStorage.
 */
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
        
        // Retrieve complex data stored on the element's custom property.
        const subGoals = card.habitData.subGoals;
        const notes = card.habitData.notes;

        habits.push({ title, squares, color, deadline, creationDate, totalSquares, subGoals, notes });
    });
    localStorage.setItem('habitAppData', JSON.stringify(habits));
}

// Core Application Logic
/**
 * Creates a new habit card and adds it to the DOM.
 * This function handles both creating brand new habits and recreating habits from saved data.
 * @param {string} title - The name of the habit.
 * @param {boolean[]} [savedSquares=null] - An array of completion statuses for each day.
 * @param {string} [savedColor=null] - The specific color for the habit.
 * @param {string} [deadline=null] - The deadline date for the habit.
 * @param {string} [savedCreationDate=null] - The creation date from saved data.
 * @param {number} [savedTotalSquares=null] - The total number of days for the habit from saved data.
 * @param {object[]} [savedSubGoals=[]] - Array of sub-goal objects.
 * @param {object[]} [savedNotes=[]] - Array of note objects.
 */
function addNewHabit(title, savedSquares = null, savedColor = null, deadline = null, savedCreationDate = null, savedTotalSquares = null, savedSubGoals = [], savedNotes = []) {
    const card = document.createElement('section');
    card.classList.add('habit-card');
    
    // Attach a custom property to the DOM element to hold complex data like sub-goals and notes.
    card.habitData = { 
        subGoals: savedSubGoals || [],
        notes: savedNotes || []
    };
    
    const createdOn = savedCreationDate || new Date().toISOString();
    let totalSquares = savedTotalSquares;
    
    // If it's a new habit, calculate the total days based on the deadline or default to 365.
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

    // Assign a color from the palette, cycling through them for new habits.
    const existingCount = document.querySelectorAll('.habit-card').length;
    const themeColor = savedColor || palette[existingCount % palette.length];
    card.style.setProperty('--habit-color', themeColor);

    // Generate the deadline badge HTML if a deadline is set.
    let deadlineBadgeHtml = '';
    if (deadline) {
        const daysLeft = calculateDaysBetween(new Date().toISOString(), deadline);
        let text = daysLeft > 0 ? `${daysLeft} Days Left` : (daysLeft === 0 ? "Deadline Today!" : "Past Deadline");
        deadlineBadgeHtml = `<span class="deadline-badge">⏳ ${text}</span>`;
    }

    // Use a template literal to create the card's inner structure.
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

    // Get references to all the newly created elements within the card.
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

    // Setup for the SVG circular progress bar animation.
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;

    // Create the grid of squares for each day.
    for (let i = 0; i < totalSquares; i++) {
        const square = document.createElement('div');
        square.classList.add('square');
        square.title = getDateFromDayIndex(i, createdOn); 

        if (savedSquares && savedSquares[i]) {
            square.classList.add('completed');
        }

        // Add click listener to toggle completion status and update everything.
        square.addEventListener('click', () => {
            square.classList.toggle('completed');
            updateCardStats(grid, streakDisplay, progressCircle, percentText, circumference, totalSquares);
            updateChartData(grid, chartInstance, createdOn);
            saveHabits();
        });

        grid.appendChild(square);
    }

    // Initialize the Chart.js instance for the analytics graph.
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

    /**
     * Renders the list of sub-goals and attaches event listeners for checking and deleting.
     */
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

    /**
     * Renders the list of notes and attaches event listeners for deleting.
     */
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

    // Event listener for adding a new sub-goal.
    addSubGoalBtn.addEventListener('click', () => {
        const text = subGoalInput.value.trim();
        if (text) {
            card.habitData.subGoals.push({ text: text, completed: false });
            subGoalInput.value = '';
            renderSubGoals();
            saveHabits();
        }
    });

    // Event listener for adding a new note.
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

    // Event listeners for the main card controls (details, analytics, delete).
    detailsBtn.addEventListener('click', () => { detailsPanel.classList.toggle('active'); });
    analyticsBtn.addEventListener('click', () => { chartContainer.classList.toggle('active'); });
    deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete the habit "${title}"?`)) { card.remove(); saveHabits(); }
    });

    // Add the fully constructed card to the DOM and perform initial UI updates.
    habitList.appendChild(card);
    
    renderSubGoals();
    renderNotes();
    updateCardStats(grid, streakDisplay, progressCircle, percentText, circumference, totalSquares);
    updateChartData(grid, chartInstance, createdOn);
}

/**
 * Updates the statistics on a habit card (streak, completion percentage).
 * @param {HTMLElement} gridElement - The .habit-grid element.
 * @param {HTMLElement} streakDisplay - The element showing the streak number.
 * @param {HTMLElement} circle - The SVG circle for the progress ring.
 * @param {HTMLElement} text - The SVG text for the percentage.
 * @param {number} circumference - The circumference of the progress circle.
 * @param {number} totalSquares - The total number of days for the habit.
 */
function updateCardStats(gridElement, streakDisplay, circle, text, circumference, totalSquares) {
    const allSquares = gridElement.querySelectorAll('.square');
    const completedCount = gridElement.querySelectorAll('.square.completed').length;
    
    // Update completion percentage and progress ring.
    const percentage = Math.round((completedCount / totalSquares) * 100);
    text.textContent = `${percentage}%`;
    circle.style.strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Calculate the current streak by finding the last completed day and counting backwards.
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

/**
 * Updates the data for the monthly completion bar chart.
 * @param {HTMLElement} gridElement - The .habit-grid element.
 * @param {Chart} chart - The Chart.js instance.
 * @param {string} createdOn - The ISO string of the habit's creation date.
 */
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

/**
 * Exports all habit data to a downloadable CSV file.
 */
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

// Global Event Listeners
exportBtn.addEventListener('click', exportToCSV);

// Listener for the "Clear All Data" button.
clearBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all habits?")) {
        localStorage.removeItem('habitAppData');
        location.reload();
    }
});

// Listeners for the "Add New Habit" modal.
addBtn.addEventListener('click', () => { modal.classList.remove('hidden'); });

cancelAddBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    // Clear inputs on cancel.
    nameInput.value = ''; 
    deadlineInput.value = ''; 
});

// Listener for the confirm button in the "Add New Habit" modal.
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

// App Initialization
/**
 * Initializes the application on page load.
 * It checks for saved data in localStorage and either loads it or shows the "add habit" modal.
 */
function initApp() {
    const rawData = localStorage.getItem('habitAppData');
    if (rawData && JSON.parse(rawData).length > 0) {
        const savedHabits = JSON.parse(rawData);
        // Recreate each habit card from the saved data.
        savedHabits.forEach(h => addNewHabit(h.title, h.squares, h.color, h.deadline, h.creationDate, h.totalSquares, h.subGoals, h.notes));
    } else {
        // If no data, show the modal to prompt the user to create their first habit.
        modal.classList.remove('hidden');
    }
}

initApp(); // Run the app!