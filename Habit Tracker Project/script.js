/* Selectors and configuration */
const habitList = document.getElementById('habit-list');
const addBtn = document.getElementById('add-habit');
const clearBtn = document.getElementById('clear-data');
const totalSquares = 365;

/* Local Storage Logic */
function saveHabits() {
    const habits = [];
    const cards = document.querySelectorAll('.habit-card');
    cards.forEach(card => {
        const title = card.querySelector('.habit-title').textContent;
        const squares = Array.from(card.querySelectorAll('.square')).map(sq => 
            sq.classList.contains('completed')
        );
        habits.push({ title, squares });
    });
    localStorage.setItem('habitAppData', JSON.stringify(habits));
}

/* Habit Creation Logic */
function addNewHabit(title, savedSquares = null) {
    const card = document.createElement('section');
    card.classList.add('habit-card');

    /* Here I restructured the HTML of the card. I wrapped the habit info 
       and grid in a 'card-main' div and added a 'card-stats' div to the right 
       to hold our new Circular Progress SVG. */
    card.innerHTML = `
        <div class="card-main">
            <div class="habit-info">
                <h2 class="habit-title">${title}</h2>
                <span class="streak-count">🔥 <span class="streak-val">0</span> Day Streak</span>
            </div>
            <div class="habit-grid"></div>
        </div>
        <div class="card-stats">
            <svg class="progress-ring" width="70" height="70">
                <circle class="progress-ring-circle-bg" cx="35" cy="35" r="30"></circle>
                <circle class="progress-ring-circle" cx="35" cy="35" r="30"></circle>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" class="percentage-text">0%</text>
            </svg>
        </div>
    `;

    const grid = card.querySelector('.habit-grid');
    const streakDisplay = card.querySelector('.streak-val');
    const progressCircle = card.querySelector('.progress-ring-circle');
    const percentText = card.querySelector('.percentage-text');

    // Setting up the SVG ring (Circumference = 2 * PI * r)
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;

    for (let i = 0; i < totalSquares; i++) {
        const square = document.createElement('div');
        square.classList.add('square');

        if (savedSquares && savedSquares[i]) {
            square.classList.add('completed');
        }

        square.addEventListener('click', () => {
            square.classList.toggle('completed');
            // Update both streak and percentage ring on click
            updateCardStats(grid, streakDisplay, progressCircle, percentText, circumference);
            saveHabits();
        });

        grid.appendChild(square);
    }

    habitList.appendChild(card);
    updateCardStats(grid, streakDisplay, progressCircle, percentText, circumference);
}

/* Stats Logic (Combined Streak and Progress Ring) */
/* Here I expanded the streak logic into updateCardStats. In addition to 
   calculating the streak, it now counts every completed square to calculate 
   a percentage and updates the SVG ring animation. */
function updateCardStats(gridElement, streakDisplay, circle, text, circumference) {
    const allSquares = gridElement.querySelectorAll('.square');
    const completedCount = gridElement.querySelectorAll('.square.completed').length;
    
    // 1. Update Percentage Visualization
    const percentage = Math.round((completedCount / totalSquares) * 100);
    text.textContent = `${percentage}%`;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // 2. Original Streak Logic Fix
    let lastCompletedIndex = -1;
    for (let i = allSquares.length - 1; i >= 0; i--) {
        if (allSquares[i].classList.contains('completed')) {
            lastCompletedIndex = i;
            break;
        }
    }

    if (lastCompletedIndex === -1) {
        streakDisplay.textContent = 0;
        return;
    }

    let currentStreak = 0;
    for (let i = lastCompletedIndex; i >= 0; i--) {
        if (allSquares[i].classList.contains('completed')) {
            currentStreak++;
        } else {
            break; 
        }
    }
    streakDisplay.textContent = currentStreak;
}

/* Keep your existing ClearBtn, addBtn, and initApp logic below */
clearBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all habits? This cannot be undone.")) {
        localStorage.removeItem('habitAppData');
        location.reload();
    }
});

addBtn.addEventListener('click', () => {
    const habitName = prompt("Enter habit name:");
    if (habitName) {
        addNewHabit(habitName);
        saveHabits();
    }
});

function initApp() {
    const rawData = localStorage.getItem('habitAppData');
    if (rawData) {
        const savedHabits = JSON.parse(rawData);
        savedHabits.forEach(h => addNewHabit(h.title, h.squares));
    } else {
        const firstHabit = prompt("Welcome! Enter your first habit to track:");
        if (firstHabit) {
            addNewHabit(firstHabit);
            saveHabits();
        }
    }
}

initApp();