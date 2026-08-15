// App State
let state = null;
let currentSubjectId = null;

// DOM Elements
const views = {
    dashboard: document.getElementById('dashboard-view'),
    detail: document.getElementById('detail-view')
};

// Initialize App
function init() {
    loadState();
    calculateAllMetrics();
    renderDashboard();
    setupEventListeners();
    
    // Set default date in modal to today
    document.getElementById('log-date').valueAsDate = new Date();
}

// Data Management
function loadState() {
    const saved = localStorage.getItem('gateCivilTracker2027');
    if (saved) {
        state = JSON.parse(saved);
        // Basic migration in case of new fields
        if(!state.pyqs) state.pyqs = defaultState.pyqs;
    } else {
        // Deep clone default state
        state = JSON.parse(JSON.stringify(defaultState));
    }
}

function saveState() {
    localStorage.setItem('gateCivilTracker2027', JSON.stringify(state));
    calculateAllMetrics();
}

// Calculations
function calculateAllMetrics() {
    let overallSyllabusWeightCompleted = 0;
    
    state.subjects.forEach(subject => {
        let subjectTotalWeight = 0;
        let subjectCompletedWeight = 0;
        let subjectHours = 0;
        
        subject.topics.forEach(t => {
            subjectTotalWeight += t.trackerWeight;
            if (t.completed) {
                subjectCompletedWeight += t.trackerWeight;
            }
        });
        
        // Calculate subject hours
        state.studyHistory.forEach(entry => {
            if (entry.subjectId === subject.id) {
                subjectHours += entry.hours;
            }
        });
        
        subject.progress = subjectTotalWeight === 0 ? 0 : (subjectCompletedWeight / subjectTotalWeight) * 100;
        subject.hours = subjectHours;
        
        // Add to overall (subject.progress is a percentage, trackerWeight is out of 100)
        overallSyllabusWeightCompleted += (subject.progress / 100) * subject.trackerWeight;
    });
    
    state.overallSyllabusProgress = overallSyllabusWeightCompleted; // out of 100%
    
    // Total Hours
    state.totalHours = state.studyHistory.reduce((acc, curr) => acc + curr.hours, 0);
    
    // Dummy calculations for PYQs, Tests, Mocks, Revision for the MVP dashboard
    let pyqTotal = 0, pyqSolved = 0;
    Object.values(state.pyqs).forEach(p => { pyqTotal += p.total; pyqSolved += p.solved; });
    state.pyqProgress = pyqTotal === 0 ? 0 : (pyqSolved / pyqTotal) * 100;
    
    state.testProgress = ((state.tests.topic.completed + state.tests.subject.completed) / (state.tests.topic.total + state.tests.subject.total)) * 100;
    state.mockProgress = (state.mocks.completed / state.mocks.total) * 100;
    state.revisionProgress = ((state.revision['1st'] + state.revision['2nd'] + state.revision.final) / state.revision.total) * 100;
    
    // Readiness Formula (Custom tracker estimate)
    // 50% Syllabus, 20% PYQs, 15% Tests, 10% Mocks, 5% Revision
    state.gateReadiness = (state.overallSyllabusProgress * 0.5) + 
                          (state.pyqProgress * 0.2) + 
                          (state.testProgress * 0.15) + 
                          (state.mockProgress * 0.1) + 
                          (state.revisionProgress * 0.05);
}

// Formatters
function formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
}

function formatPercent(value) {
    return value.toFixed(1) + '%';
}

// Rendering
function renderDashboard() {
    // Update Hero
    document.getElementById('hero-progress-text').textContent = formatPercent(state.overallSyllabusProgress);
    document.getElementById('hero-progress-circle').style.setProperty('--progress', `${state.overallSyllabusProgress}%`);
    
    document.getElementById('metric-syllabus').textContent = formatPercent(state.overallSyllabusProgress);
    document.getElementById('metric-pyqs').textContent = formatPercent(state.pyqProgress);
    document.getElementById('metric-tests').textContent = formatPercent(state.testProgress);
    document.getElementById('metric-mocks').textContent = formatPercent(state.mockProgress);
    document.getElementById('metric-revision').textContent = formatPercent(state.revisionProgress);
    document.getElementById('metric-hours').textContent = formatHours(state.totalHours);
    document.getElementById('metric-readiness').textContent = formatPercent(state.gateReadiness);
    
    // Quick summary
    document.getElementById('qs-syllabus').textContent = `Syllabus — ${formatPercent(state.overallSyllabusProgress)}`;
    document.getElementById('qs-pyqs').textContent = `PYQs — ${formatPercent(state.pyqProgress)}`;
    document.getElementById('qs-tests').textContent = `Tests — ${formatPercent(state.testProgress)}`;
    document.getElementById('qs-mocks').textContent = `Mocks — ${formatPercent(state.mockProgress)}`;
    document.getElementById('qs-revision').textContent = `Revision — ${formatPercent(state.revisionProgress)}`;
    document.getElementById('qs-hours').textContent = `Study Time — ${formatHours(state.totalHours)}`;
    
    // Render Subjects
    const container = document.getElementById('subjects-container');
    container.innerHTML = '';
    
    const bgMap = { general_aptitude: 'surface-ga', engineering_mathematics: 'surface-em', structural_engineering: 'surface-se', geotechnical_engineering: 'surface-ge', water_resources_engineering: 'surface-wre', environmental_engineering: 'surface-ee', transportation_engineering: 'surface-te', geomatics_engineering: 'surface-gm', construction_materials: 'surface-cm' };
    state.subjects.forEach(sub => {
        const card = document.createElement('div');
        card.className = `subject-card ${bgMap[sub.id] || ''}`;
        card.dataset.id = sub.id;
        card.innerHTML = `
            <div class="subject-header">
                <div class="subject-icon">${sub.icon}</div>
                <div class="subject-info">
                    <h3>${sub.name}</h3>
                    <div class="subject-weight">Tracker Weight: ${sub.trackerWeight}%</div>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${sub.progress}%"></div>
                </div>
                <div class="progress-stats">
                    <span>${formatPercent(sub.progress)} Complete</span>
                </div>
            </div>
            <div class="subject-footer">
                <div class="subject-hours">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${formatHours(sub.hours)} studied
                </div>
                <button class="btn btn-open" data-id="${sub.id}">OPEN →</button>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Bind Open buttons
    document.querySelectorAll('.btn-open').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openDetailView(e.target.dataset.id);
        });
    });
}

function openDetailView(subjectId) {
    currentSubjectId = subjectId;
    views.dashboard.style.display = 'none';
    views.detail.style.display = 'block';
    renderDetailView();
}

function renderDetailView() {
    const subject = state.subjects.find(s => s.id === currentSubjectId);
    if(!subject) return;
    
    document.getElementById('detail-subject-name').textContent = subject.name;
    document.getElementById('detail-progress').textContent = formatPercent(subject.progress);
    document.getElementById('detail-weight').textContent = subject.trackerWeight + '%';
    document.getElementById('detail-hours').textContent = formatHours(subject.hours);
    
    // Render Topics
    const topicsContainer = document.getElementById('topics-container');
    topicsContainer.innerHTML = '';
    
    subject.topics.forEach((topic, index) => {
        const el = document.createElement('div');
        el.className = `topic-item ${topic.completed ? 'completed' : ''}`;
        el.dataset.index = index;
        el.innerHTML = `
            <div class="topic-left">
                <div class="checkbox">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span class="topic-name">${topic.name}</span>
            </div>
            <span class="topic-weight">${topic.trackerWeight.toFixed(1)}%</span>
        `;
        
        el.addEventListener('click', () => {
            topic.completed = !topic.completed;
            saveState();
            renderDetailView(); // Re-render detail
        });
        
        topicsContainer.appendChild(el);
    });
    
    // Render History
    const historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = '';
    
    const subjectHistory = state.studyHistory.filter(h => h.subjectId === currentSubjectId).sort((a,b) => new Date(b.date) - new Date(a.date));
    
    if(subjectHistory.length === 0) {
        historyContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem;">No study hours logged yet.</div>';
    } else {
        subjectHistory.forEach(entry => {
            const dateObj = new Date(entry.date);
            const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-left">
                    <span class="history-date">${dateStr}</span>
                    ${entry.note ? `<span class="history-note">${entry.note}</span>` : ''}
                </div>
                <div class="history-hours">${formatHours(entry.hours)}</div>
                <button class="btn btn-delete-history" data-id="${entry.id}" style="padding: 4px 8px; font-size: 0.7rem; border-color: rgba(255,0,0,0.3); color: #fca5a5;">Delete</button>
            `;
            historyContainer.appendChild(el);
        });
        
        // Bind delete buttons
        document.querySelectorAll('.btn-delete-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                state.studyHistory = state.studyHistory.filter(h => h.id !== id);
                saveState();
                renderDetailView();
            });
        });
    }
}

// Date helpers for study log limits (up to today, max past 1 year)
function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDateLimits() {
    const now = new Date();
    const todayStr = getLocalDateString(now);
    
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const minDateStr = getLocalDateString(oneYearAgo);
    
    return { min: minDateStr, max: todayStr };
}

// Modal Logic
const modal = document.getElementById('log-modal');

function openModal() {
    modal.style.display = 'flex';
    const { min, max } = getDateLimits();
    const dateInput = document.getElementById('log-date');
    dateInput.min = min;
    dateInput.max = max;
    dateInput.value = max;
    document.getElementById('log-amount').value = '';
    document.getElementById('log-note').value = '';
}

function closeModal() {
    modal.style.display = 'none';
}

function saveHours() {
    const date = document.getElementById('log-date').value;
    const hours = parseFloat(document.getElementById('log-amount').value);
    const note = document.getElementById('log-note').value.trim();
    const { min, max } = getDateLimits();
    
    if (!date || isNaN(hours) || hours <= 0) {
        alert('Please enter a valid date and positive number of hours.');
        return;
    }
    if (date > max) {
        alert('You cannot log study hours for tomorrow or future dates.');
        return;
    }
    if (date < min) {
        alert('You can only log study hours within the last 1 year limit.');
        return;
    }
    if (hours > 16) {
        alert('You can log a maximum of 16 hours per entry.');
        return;
    }
    
    const newEntry = {
        id: Date.now().toString(),
        date: date,
        subjectId: currentSubjectId,
        hours: hours,
        note: note
    };
    
    state.studyHistory.push(newEntry);
    saveState();
    closeModal();
    renderDetailView();
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('btn-back').addEventListener('click', () => {
        views.detail.style.display = 'none';
        views.dashboard.style.display = 'block';
        currentSubjectId = null;
        renderDashboard();
    });
    
    document.getElementById('btn-log-hours').addEventListener('click', openModal);
    document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('btn-modal-save').addEventListener('click', saveHours);
    
    const logAmountInput = document.getElementById('log-amount');
    if (logAmountInput) {
        logAmountInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (val > 16) {
                e.target.value = 16;
            }
        });
    }

    const logDateInput = document.getElementById('log-date');
    if (logDateInput) {
        logDateInput.addEventListener('change', (e) => {
            const { min, max } = getDateLimits();
            if (e.target.value > max) {
                alert('You cannot select tomorrow or future dates.');
                e.target.value = max;
            } else if (e.target.value < min) {
                alert('You can only log study hours within the last 1 year.');
                e.target.value = min;
            }
        });
    }

    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const val = parseFloat(e.target.dataset.hours);
            const input = document.getElementById('log-amount');
            const current = parseFloat(input.value) || 0;
            const newValue = current + val;
            input.value = newValue > 16 ? 16 : newValue;
        });
    });
    
    // Click outside modal to close
    modal.addEventListener('click', (e) => {
        if(e.target === modal) closeModal();
    });
    
    // Top right actions
    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            state = JSON.parse(JSON.stringify(defaultState));
            saveState();
            renderDashboard();
            if(currentSubjectId) renderDetailView();
        }
    });
    
    document.getElementById('btn-export').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "gate-civil-tracker-2027.json");
        dlAnchorElem.click();
    });
    
    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    
    document.getElementById('import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedState = JSON.parse(event.target.result);
                if(importedState && importedState.subjects) {
                    state = importedState;
                    saveState();
                    renderDashboard();
                    if(currentSubjectId) renderDetailView();
                    alert('Progress imported successfully!');
                } else {
                    alert('Invalid file format.');
                }
            } catch(err) {
                alert('Error parsing file.');
            }
        };
        reader.readAsText(file);
    });
}

// Boot
init();
