// @ts-nocheck
import { defaultState } from '../data.js';
import { evaluateAchievements } from './achievementEngine.js';
import achievementsData from '../data/achievements.json' with { type: 'json' };

// Hardened HTML and Attribute Entity Escaper
export const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

export const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

let cachedState = null;

if (typeof window !== 'undefined') {
    window.addEventListener('storage', () => { cachedState = null; });
}

// Robust state sanitizer & self-healing recovery engine
export const sanitizeAndRepairState = (raw) => {
    const fallback = JSON.parse(JSON.stringify(defaultState));
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return fallback;
    }

    const state = {};

    // 1. Settings
    state.settings = {
        theme: 'dark',
        weights: {
            syllabus: (raw.settings?.weights?.syllabus !== undefined && !isNaN(Number(raw.settings.weights.syllabus))) ? Number(raw.settings.weights.syllabus) : 0.60,
            pyqs: (raw.settings?.weights?.pyqs !== undefined && !isNaN(Number(raw.settings.weights.pyqs))) ? Number(raw.settings.weights.pyqs) : 0.15,
            tests: (raw.settings?.weights?.tests !== undefined && !isNaN(Number(raw.settings.weights.tests))) ? Number(raw.settings.weights.tests) : 0.10,
            mocks: (raw.settings?.weights?.mocks !== undefined && !isNaN(Number(raw.settings.weights.mocks))) ? Number(raw.settings.weights.mocks) : 0.10,
            revision: (raw.settings?.weights?.revision !== undefined && !isNaN(Number(raw.settings.weights.revision))) ? Number(raw.settings.weights.revision) : 0.05
        }
    };

    // 2. Flags
    state.exportedOnce = Boolean(raw.exportedOnce);
    state.importedOnce = Boolean(raw.importedOnce);

    // 3. Achievements
    state.achievements = {
        unlocked: (raw.achievements?.unlocked && typeof raw.achievements.unlocked === 'object' && !Array.isArray(raw.achievements.unlocked)) ? raw.achievements.unlocked : {},
        xp: Math.max(0, parseInt(raw.achievements?.xp) || 0),
        level: Math.max(1, parseInt(raw.achievements?.level) || 1),
        lastDailyXPDate: (typeof raw.achievements?.lastDailyXPDate === 'string') ? raw.achievements.lastDailyXPDate : null
    };

    // 4. Streaks
    state.streaks = {
        current: Math.max(0, parseInt(raw.streaks?.current) || 0),
        longest: Math.max(0, parseInt(raw.streaks?.longest) || 0),
        claimedMilestones: Array.isArray(raw.streaks?.claimedMilestones) ? raw.streaks.claimedMilestones.filter(m => typeof m === 'number') : []
    };

    // 5. Subjects
    if (Array.isArray(raw.subjects) && raw.subjects.length > 0) {
        state.subjects = raw.subjects.map(rawSub => {
            const defSub = fallback.subjects.find(s => s.id === rawSub.id) || fallback.subjects[0];
            const sub = {
                id: typeof rawSub.id === 'string' ? rawSub.id : defSub.id,
                name: typeof rawSub.name === 'string' ? rawSub.name : defSub.name,
                trackerWeight: (!isNaN(Number(rawSub.trackerWeight)) && Number(rawSub.trackerWeight) >= 0) ? Number(rawSub.trackerWeight) : defSub.trackerWeight,
                icon: defSub.icon || '',
                topics: []
            };

            if (Array.isArray(rawSub.topics) && rawSub.topics.length > 0) {
                sub.topics = rawSub.topics.map((t, idx) => ({
                    id: typeof t.id === 'string' ? t.id : `topic_${idx}`,
                    name: typeof t.name === 'string' ? t.name : `Topic ${idx + 1}`,
                    trackerWeight: (!isNaN(Number(t.trackerWeight)) && Number(t.trackerWeight) >= 0) ? Number(t.trackerWeight) : 1.0,
                    completed: Boolean(t.completed)
                }));
            } else {
                sub.topics = JSON.parse(JSON.stringify(defSub.topics || []));
            }
            return sub;
        });

        // Ensure all 9 default subjects exist
        fallback.subjects.forEach(defSub => {
            if (!state.subjects.some(s => s.id === defSub.id)) {
                state.subjects.push(JSON.parse(JSON.stringify(defSub)));
            }
        });
    } else {
        state.subjects = JSON.parse(JSON.stringify(fallback.subjects));
    }

    // 6. PYQs
    state.pyqs = {};
    Object.keys(fallback.pyqs).forEach(subId => {
        const rawPyq = raw.pyqs?.[subId];
        const defTotal = fallback.pyqs[subId].total;
        state.pyqs[subId] = {
            solved: Math.max(0, parseInt(rawPyq?.solved) || 0),
            total: Math.max(1, parseInt(rawPyq?.total) || defTotal)
        };
        // Normalize legacy totals
        if ((subId === 'geomatics_engineering' || subId === 'construction_materials') && state.pyqs[subId].total === 80) {
            state.pyqs[subId].total = 100;
        }
    });

    // 7. Tests
    state.tests = {
        topic: {
            completed: Math.max(0, parseInt(raw.tests?.topic?.completed) || 0),
            total: Math.max(1, parseInt(raw.tests?.topic?.total) || 40)
        },
        subject: {
            completed: Math.max(0, parseInt(raw.tests?.subject?.completed) || 0),
            total: Math.max(1, parseInt(raw.tests?.subject?.total) || 10)
        }
    };

    // 8. Mocks
    state.mocks = {
        completed: Math.max(0, parseInt(raw.mocks?.completed) || 0),
        total: Math.max(1, parseInt(raw.mocks?.total) || 20)
    };

    // 9. Revision
    state.revision = {
        '1st': Math.max(0, parseInt(raw.revision?.['1st']) || 0),
        '2nd': Math.max(0, parseInt(raw.revision?.['2nd']) || 0),
        final: Math.max(0, parseInt(raw.revision?.final) || 0),
        total: Math.max(1, parseInt(raw.revision?.total) || 9)
    };

    // 10. Histories
    const sanitizeHistoryArray = (arr) => {
        if (!Array.isArray(arr)) return [];
        return arr.filter(item => item && typeof item === 'object' && item.id);
    };

    state.studyHistory = sanitizeHistoryArray(raw.studyHistory);
    state.pyqHistory = sanitizeHistoryArray(raw.pyqHistory);
    state.testHistory = sanitizeHistoryArray(raw.testHistory);
    state.mocksHistory = sanitizeHistoryArray(raw.mocksHistory);
    state.revisionHistory = sanitizeHistoryArray(raw.revisionHistory);

    // 11. Legacy Data Migrations
    const today = new Date().toISOString().split('T')[0];

    if (!raw.pyqHistory && state.pyqHistory.length === 0) {
        Object.entries(state.pyqs).forEach(([subId, data]) => {
            if (data.solved > 0) {
                state.pyqHistory.push({
                    id: 'mig_pyq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    subjectId: subId,
                    date: today,
                    solved: data.solved,
                    notes: 'Legacy migration'
                });
            }
        });
    }

    if (!raw.testHistory && state.testHistory.length === 0) {
        if (state.tests.topic.completed > 0) {
            for (let i = 0; i < state.tests.topic.completed; i++) {
                state.testHistory.push({
                    id: 'mig_tt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + i,
                    testType: 'topic',
                    subjectId: 'general',
                    date: today,
                    notes: 'Legacy migration'
                });
            }
        }
        if (state.tests.subject.completed > 0) {
            for (let i = 0; i < state.tests.subject.completed; i++) {
                state.testHistory.push({
                    id: 'mig_st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + i,
                    testType: 'subject',
                    subjectId: 'general',
                    date: today,
                    notes: 'Legacy migration'
                });
            }
        }
    }

    if (!raw.mocksHistory && state.mocksHistory.length === 0) {
        if (state.mocks.completed > 0) {
            for (let i = 0; i < state.mocks.completed; i++) {
                state.mocksHistory.push({
                    id: 'mig_mk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + i,
                    name: `Legacy Mock ${i + 1}`,
                    date: today,
                    notes: 'Legacy migration'
                });
            }
        }
    }

    if (!raw.revisionHistory && state.revisionHistory.length === 0) {
        ['1st', '2nd', 'final'].forEach(revType => {
            if (state.revision[revType] > 0) {
                for (let i = 0; i < state.revision[revType]; i++) {
                    state.revisionHistory.push({
                        id: 'mig_rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + i,
                        subjectId: 'general',
                        revisionType: revType,
                        date: today,
                        notes: 'Legacy migration'
                    });
                }
            }
        });
    }

    return state;
};

export const getState = () => {
    if (cachedState) return cachedState;
    if (typeof window === 'undefined') {
        return JSON.parse(JSON.stringify(defaultState));
    }
    const saved = localStorage.getItem('gateCivilTracker2027');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            cachedState = sanitizeAndRepairState(parsed);
            return cachedState;
        } catch(e) {
            console.error("Error parsing saved state, recovering gracefully", e);
        }
    }
    cachedState = JSON.parse(JSON.stringify(defaultState));
    return cachedState;
};

export const updateHeaderBadge = (state) => {
    if (typeof document === 'undefined') return;
    const badge = document.getElementById('ach-badge');
    if (!badge) return;
    const unlockedMap = state?.achievements?.unlocked || {};
    const unviewedCount = Object.values(unlockedMap).filter(a => a && a.viewed === false).length;
    if (unviewedCount > 0) {
        badge.textContent = unviewedCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
};

export const calculateAllMetrics = (state) => {
    if (!state) return;
    // --- Derive counts from histories ---
    if (state.pyqs) {
        Object.keys(state.pyqs).forEach(k => {
            state.pyqs[k].solved = 0;
        });
        if (state.pyqHistory) {
            state.pyqHistory.forEach(h => {
                if (state.pyqs[h.subjectId]) {
                    state.pyqs[h.subjectId].solved += (h.solved !== undefined ? (parseInt(h.solved) || 1) : 1);
                }
            });
        }
    }
    
    if (state.testHistory && state.tests) {
        if (state.tests.topic) state.tests.topic.completed = state.testHistory.filter(t => t.testType === 'topic').length;
        if (state.tests.subject) state.tests.subject.completed = state.testHistory.filter(t => t.testType === 'subject').length;
    }
    
    if (state.mocksHistory && state.mocks) {
        state.mocks.completed = state.mocksHistory.length;
    }
    
    if (state.revisionHistory && state.revision) {
        state.revision['1st'] = state.revisionHistory.filter(r => r.revisionType === '1st').length;
        state.revision['2nd'] = state.revisionHistory.filter(r => r.revisionType === '2nd').length;
        state.revision.final = state.revisionHistory.filter(r => r.revisionType === 'final').length;
    }

    // --- Cap derived counts to their respective totals ---
    if (state.pyqs) {
        Object.keys(state.pyqs).forEach(k => {
            state.pyqs[k].solved = Math.min(state.pyqs[k].solved, state.pyqs[k].total);
        });
    }
    if (state.tests?.topic) {
        state.tests.topic.completed = Math.min(state.tests.topic.completed, state.tests.topic.total);
    }
    if (state.tests?.subject) {
        state.tests.subject.completed = Math.min(state.tests.subject.completed, state.tests.subject.total);
    }
    if (state.mocks) {
        state.mocks.completed = Math.min(state.mocks.completed, state.mocks.total);
    }
    if (state.revision) {
        state.revision['1st'] = Math.min(state.revision['1st'], state.revision.total);
        state.revision['2nd'] = Math.min(state.revision['2nd'], state.revision.total);
        state.revision.final = Math.min(state.revision.final, state.revision.total);
    }
    // --- End capping ---
    
    let overallSyllabusWeightCompleted = 0;
    let totalSubjectTrackerWeight = 0;
    
    if (Array.isArray(state.subjects)) {
        state.subjects.forEach(subject => {
            let subjectTotalWeight = 0;
            let subjectCompletedWeight = 0;
            let subjectHours = 0;
            
            if (Array.isArray(subject.topics)) {
                subject.topics.forEach(t => {
                    const tw = parseFloat(t.trackerWeight) || 0;
                    subjectTotalWeight += tw;
                    if (t.completed) {
                        subjectCompletedWeight += tw;
                    }
                });
            }
            
            [state.studyHistory, state.pyqHistory, state.testHistory, state.revisionHistory].forEach(history => {
                if (history) {
                    history.forEach(entry => {
                        if (entry.subjectId === subject.id && entry.hours) {
                            subjectHours += (parseFloat(entry.hours) || 0);
                        }
                    });
                }
            });
            
            subject.progress = subjectTotalWeight === 0 ? 0 : (subjectCompletedWeight / subjectTotalWeight) * 100;
            subject.hours = subjectHours;
            overallSyllabusWeightCompleted += (subject.progress / 100) * (parseFloat(subject.trackerWeight) || 0);
            totalSubjectTrackerWeight += (parseFloat(subject.trackerWeight) || 0);
        });
    }
    
    // 1. Syllabus Progress: 0% to 100% based on all subject sub-topic completions
    state.overallSyllabusProgress = totalSubjectTrackerWeight === 0 ? 0 : (overallSyllabusWeightCompleted / totalSubjectTrackerWeight) * 100;
    let addedHours = 0;
    [state.pyqHistory, state.testHistory, state.mocksHistory, state.revisionHistory].forEach(history => {
        if (history) {
            addedHours += history.reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0);
        }
    });
    state.totalHours = (state.studyHistory ? state.studyHistory.reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0) : 0) + addedHours;
    
    // 2. PYQs Progress: 0% to 100% based on questions solved vs total across all subjects
    let pyqTotal = 0, pyqSolved = 0;
    if (state.pyqs) {
        Object.values(state.pyqs).forEach(p => { pyqTotal += (p.total || 0); pyqSolved += (p.solved || 0); });
    }
    state.pyqProgress = pyqTotal === 0 ? 0 : (pyqSolved / pyqTotal) * 100;
    
    // 3. Tests Progress: 0% to 100% based on topic + subject tests completed vs targets
    const totalTests = ((state.tests?.topic?.total || 0) + (state.tests?.subject?.total || 0));
    state.testProgress = totalTests === 0 ? 0 : (((state.tests?.topic?.completed || 0) + (state.tests?.subject?.completed || 0)) / totalTests) * 100;
    
    // 4. Mocks Progress: 0% to 100% based on full-length mocks completed vs target
    const totalMocks = (state.mocks?.total || 0);
    state.mockProgress = totalMocks === 0 ? 0 : ((state.mocks?.completed || 0) / totalMocks) * 100;
    
    // 5. Revision Progress: 0% to 100% based on 1st, 2nd, and final revision rounds (total subjects * 3)
    const totalRevisionTarget = (state.revision?.total || 9) * 3;
    const totalRevisionCompleted = (state.revision?.['1st'] || 0) + (state.revision?.['2nd'] || 0) + (state.revision?.final || 0);
    state.revisionProgress = totalRevisionTarget === 0 ? 0 : (totalRevisionCompleted / totalRevisionTarget) * 100;
    
    // 6. Overall GATE Readiness: Weighted composition of all 5 independent 100% pillars
    const w = state.settings?.weights || defaultState.settings.weights;
    const totalWeights = (w.syllabus + w.pyqs + w.tests + w.mocks + w.revision) || 1;
    state.gateReadiness = ((state.overallSyllabusProgress * w.syllabus) + 
                          (state.pyqProgress * w.pyqs) + 
                          (state.testProgress * w.tests) + 
                          (state.mockProgress * w.mocks) + 
                          (state.revisionProgress * w.revision)) / totalWeights;
};

export const saveState = (state) => {
    cachedState = state;
    calculateAllMetrics(state);
    
    const newUnlocks = evaluateAchievements(state, achievementsData.achievements);
    
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gateCivilTracker2027', JSON.stringify(state));
    }
    updateHeaderBadge(state);
    
    if (typeof window !== 'undefined') {
        if (newUnlocks && newUnlocks.length > 0) {
            window.dispatchEvent(new CustomEvent('achievementsUnlocked', { detail: newUnlocks }));
        }
        window.dispatchEvent(new Event('stateChanged'));
    }
};

export const formatHours = (hours) => {
    const safeHours = Math.max(0, parseFloat(hours) || 0);
    const h = Math.floor(safeHours);
    const m = Math.round((safeHours - h) * 60);
    if (m === 0) return `${h}h`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
};

export const formatPercent = (value) => {
    const safeVal = Math.max(0, Math.min(100, parseFloat(value) || 0));
    return safeVal.toFixed(1) + '%';
};

// Expose on window for backwards compatibility & inline handlers
if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
    window.debounce = debounce;
    window.sanitizeAndRepairState = sanitizeAndRepairState;
    window.getState = getState;
    window.saveState = saveState;
    window.calculateAllMetrics = calculateAllMetrics;
    window.formatHours = formatHours;
    window.formatPercent = formatPercent;
    window.updateHeaderBadge = updateHeaderBadge;
}
