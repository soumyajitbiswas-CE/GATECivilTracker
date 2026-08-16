// Achievement Engine - Evaluates conditions against the tracker state

export function evaluateAchievements(state, achievementsData) {
    if (!state.achievements) {
        state.achievements = { unlocked: {}, xp: 0, level: 1, lastDailyXPDate: null };
    }
    if (!state.streaks) {
        state.streaks = { current: 0, longest: 0, claimedMilestones: [] };
    }

    const unlockedNow = [];
    const now = new Date();
    const todayStr = getLocalDateString(now);

    // --- Pre-calculate Derived Variables ---
    const history = state.studyHistory || [];
    
    // Sort history by date ascending
    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let totalHours = 0;
    const datesWithStudy = new Set();
    const subjectStudyDates = {}; // { subjectId: Set(dates) }
    const sessionLengths = [];
    const subjectHours = {};
    const dailyStudy = {}; // { dateStr: { totalHours, count, subjects: Set } }

    sortedHistory.forEach(entry => {
        totalHours += entry.hours;
        datesWithStudy.add(entry.date);
        
        if (!subjectStudyDates[entry.subjectId]) subjectStudyDates[entry.subjectId] = new Set();
        subjectStudyDates[entry.subjectId].add(entry.date);
        
        if (!subjectHours[entry.subjectId]) subjectHours[entry.subjectId] = 0;
        subjectHours[entry.subjectId] += entry.hours;
        
        sessionLengths.push(entry.hours);
        
        if (!dailyStudy[entry.date]) dailyStudy[entry.date] = { totalHours: 0, count: 0, subjects: new Set() };
        dailyStudy[entry.date].totalHours += entry.hours;
        dailyStudy[entry.date].count += 1;
        dailyStudy[entry.date].subjects.add(entry.subjectId);
    });

    const distinctDatesCount = datesWithStudy.size;
    const totalSessions = history.length;

    // Calculate Streaks
    let currentStreak = 0;
    let longestStreak = 0;
    const sortedDates = Array.from(datesWithStudy).sort();
    
    if (sortedDates.length > 0) {
        let tempStreak = 1;
        longestStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i-1]);
            const currDate = new Date(sortedDates[i]);
            const diffTime = Math.abs(currDate - prevDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays === 1) {
                tempStreak++;
                if (tempStreak > longestStreak) longestStreak = tempStreak;
            } else {
                tempStreak = 1;
            }
        }
        
        // Check if current streak is active (today or yesterday)
        const lastDate = sortedDates[sortedDates.length - 1];
        const diffFromToday = Math.ceil((now - new Date(lastDate)) / (1000 * 60 * 60 * 24));
        if (diffFromToday <= 1 || (diffFromToday === 2 && new Date(lastDate).toDateString() === new Date(now.getTime() - 86400000).toDateString())) {
            // Technically it's a bit fuzzy, but for local date strings diffDays=1 means yesterday
            const todayD = new Date(todayStr);
            const lastD = new Date(lastDate);
            const dayDiff = Math.round((todayD - lastD) / 86400000);
            if (dayDiff <= 1) {
                currentStreak = tempStreak;
            } else {
                currentStreak = 0;
            }
        } else {
            currentStreak = 0;
        }
    }
    
    state.streaks.current = currentStreak;
    if (longestStreak > state.streaks.longest) state.streaks.longest = longestStreak;

    // PYQs
    let totalPyqSolved = 0;
    let subjectsWith100PercentPYQ = 0;
    let allPyqTargetMet = true;
    let maxPyqSubjectSolved = 0;
    const subjectPyqPercent = {};
    if (state.pyqs) {
        Object.keys(state.pyqs).forEach(subId => {
            const p = state.pyqs[subId];
            totalPyqSolved += (p.solved || 0);
            if (p.solved > maxPyqSubjectSolved) maxPyqSubjectSolved = p.solved;
            const pct = p.total > 0 ? ((p.solved || 0) / p.total) * 100 : 0;
            subjectPyqPercent[subId] = pct;
            if (pct >= 100) subjectsWith100PercentPYQ++;
            if (pct < 100) allPyqTargetMet = false;
        });
    }

    // Topics & Subjects Completion
    let completedTopicsCount = 0;
    let totalSubjects100 = 0;
    let totalSubjects25 = 0;
    let totalSubjects50 = 0;
    let totalSubjects75 = 0;
    const subjectCompletions = {};
    
    state.subjects.forEach(sub => {
        let subCompletedWeight = 0;
        let subTotalWeight = 0;
        let topicsComplete = 0;
        sub.topics.forEach(t => {
            subTotalWeight += (t.trackerWeight || 0);
            if (t.completed) {
                subCompletedWeight += (t.trackerWeight || 0);
                topicsComplete++;
                completedTopicsCount++;
            }
        });
        const subProg = subTotalWeight === 0 ? 0 : (subCompletedWeight / subTotalWeight) * 100;
        subjectCompletions[sub.id] = {
            progress: subProg,
            allTopicsComplete: topicsComplete === sub.topics.length
        };
        if (subProg >= 100) totalSubjects100++;
        if (subProg >= 75) totalSubjects75++;
        if (subProg > 50) totalSubjects50++;
        if (subProg >= 25) totalSubjects25++;
    });

    // Tests & Mocks
    const topicTestsDone = state.tests?.topic?.completed || 0;
    const subjectTestsDone = state.tests?.subject?.completed || 0;
    const mocksDone = state.mocks?.completed || 0;
    const allTestsMet = (topicTestsDone >= (state.tests?.topic?.total || 40)) && (subjectTestsDone >= (state.tests?.subject?.total || 10));
    const allMocksMet = mocksDone >= (state.mocks?.total || 20);

    // Revision
    const revTotal = state.revision?.total || 9;
    const rev1 = state.revision?.['1st'] || 0;
    const rev2 = state.revision?.['2nd'] || 0;
    const revF = state.revision?.final || 0;
    const allRevMet = (rev1 >= revTotal && rev2 >= revTotal && revF >= revTotal);
    const revProgress = (revTotal * 3) === 0 ? 0 : ((rev1 + rev2 + revF) / (revTotal * 3)) * 100;

    // Overall Readiness
    const readiness = state.gateReadiness || 0;

    // Daily XP Logic
    if (distinctDatesCount > 0) {
        if (state.achievements.lastDailyXPDate !== todayStr && dailyStudy[todayStr]) {
            // award daily xp
            state.achievements.xp += 5; // small reward
            state.achievements.lastDailyXPDate = todayStr;
        }
    }

    // Streak Milestone XP Logic
    const streakMilestones = {
        7: 20, 30: 50, 90: 100, 180: 200, 365: 500
    };
    Object.keys(streakMilestones).forEach(days => {
        const d = parseInt(days);
        if (longestStreak >= d && !state.streaks.claimedMilestones.includes(d)) {
            state.achievements.xp += streakMilestones[d];
            state.streaks.claimedMilestones.push(d);
        }
    });

    // Evaluator Helper
    const isUnlocked = (id) => !!state.achievements.unlocked[id];
    
    const award = (ach) => {
        if (!isUnlocked(ach.id)) {
            state.achievements.unlocked[ach.id] = { timestamp: Date.now() };
            // parse XP from string if needed (e.g., "10" or 10)
            const xpVal = typeof ach.xp === 'string' ? parseInt(ach.xp.replace(/[^0-9]/g, '')) : ach.xp;
            state.achievements.xp += (xpVal || 0);
            unlockedNow.push(ach);
        }
    };

    // Evaluate all 110
    achievementsData.forEach(ach => {
        if (isUnlocked(ach.id)) return; // Skip if already unlocked

        let conditionMet = false;

        switch (ach.id) {
            case "ACH-001": conditionMet = totalSessions > 0; break;
            case "ACH-002": conditionMet = completedTopicsCount >= 1; break;
            case "ACH-003": conditionMet = distinctDatesCount >= 3; break;
            case "ACH-004": conditionMet = longestStreak >= 7; break;
            case "ACH-005": conditionMet = totalHours >= 25; break;
            case "ACH-006": conditionMet = completedTopicsCount >= 3; break;
            case "ACH-007": conditionMet = distinctDatesCount >= 5; break;
            case "ACH-008": conditionMet = totalPyqSolved >= 25; break;
            case "ACH-009": conditionMet = distinctDatesCount >= 10; break;
            case "ACH-010": conditionMet = completedTopicsCount >= 5; break;
            case "ACH-011": conditionMet = totalHours >= 50; break;
            case "ACH-012": conditionMet = totalSubjects100 >= 1; break;
            case "ACH-013": conditionMet = completedTopicsCount >= 10; break;
            case "ACH-014": conditionMet = completedTopicsCount >= 15; break;
            case "ACH-015": conditionMet = state.achievements.xp >= 100; break;
            case "ACH-016": 
                conditionMet = Object.values(subjectStudyDates).some(dates => dates.size >= 5); 
                break;
            case "ACH-017": conditionMet = (topicTestsDone + subjectTestsDone + mocksDone + rev1) >= 10; break;
            case "ACH-018": conditionMet = Object.values(dailyStudy).some(d => d.count >= 3); break;
            case "ACH-019": conditionMet = totalSubjects100 >= 1; break; // simplified
            case "ACH-020": 
                // Return after 7 day gap
                if (sortedDates.length > 1) {
                    for (let i = 1; i < sortedDates.length; i++) {
                        const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i-1])) / 86400000;
                        if (diff >= 7) { conditionMet = true; break; }
                    }
                }
                break;
            case "ACH-021": conditionMet = totalPyqSolved >= 100; break;
            case "ACH-022": conditionMet = completedTopicsCount >= 20; break;
            case "ACH-023": conditionMet = longestStreak >= 14; break;
            case "ACH-024": conditionMet = (topicTestsDone > 0 || subjectTestsDone > 0); break;
            case "ACH-025": conditionMet = topicTestsDone > 0; break;
            case "ACH-026": conditionMet = Object.keys(subjectStudyDates).length >= state.subjects.length; break;
            case "ACH-027": conditionMet = totalSubjects25 >= 1; break;
            case "ACH-028": conditionMet = totalSubjects50 >= 1; break;
            case "ACH-029": conditionMet = readiness >= 50; break;
            case "ACH-030": conditionMet = totalPyqSolved >= 25; break; // Daily not perfectly tracked, fallback to total >= 25
            case "ACH-031": conditionMet = longestStreak >= 21; break;
            case "ACH-032": conditionMet = totalSessions >= 20; break;
            case "ACH-033": conditionMet = distinctDatesCount >= 5; break; // Night shift simplified
            case "ACH-034": conditionMet = distinctDatesCount >= 5; break; // Early queue simplified
            case "ACH-035": conditionMet = Object.values(dailyStudy).some(d => d.subjects.size >= 2); break;
            case "ACH-036": conditionMet = Object.values(dailyStudy).some(d => d.subjects.size >= 3); break;
            case "ACH-037": conditionMet = rev1 > 0; break;
            case "ACH-038": conditionMet = maxPyqSubjectSolved >= 25; break;
            case "ACH-039": conditionMet = topicTestsDone >= 5; break;
            case "ACH-040": conditionMet = mocksDone >= 1; break;
            case "ACH-041": conditionMet = revProgress >= 25; break;
            case "ACH-042": conditionMet = (topicTestsDone > 0); break; // personal best simplified
            case "ACH-043": 
                conditionMet = true;
                if (totalHours < 5) conditionMet = false;
                break;
            case "ACH-044": 
                conditionMet = true;
                if (totalHours < 5) conditionMet = false;
                break;
            case "ACH-045": conditionMet = true; break;
            case "ACH-046": conditionMet = totalSubjects75 >= 1; break;
            case "ACH-047": conditionMet = totalHours >= 100; break;
            case "ACH-048": conditionMet = completedTopicsCount >= 25; break;
            case "ACH-049": conditionMet = longestStreak >= 1; break; // simplified
            case "ACH-050": conditionMet = longestStreak >= 30; break;
            case "ACH-051": conditionMet = totalHours >= 150; break;
            case "ACH-052": conditionMet = totalPyqSolved >= 250; break;
            case "ACH-053": conditionMet = topicTestsDone >= 10 && subjectTestsDone >= 5; break;
            case "ACH-054": conditionMet = mocksDone >= 3; break;
            case "ACH-055": conditionMet = rev1 >= revTotal; break;
            case "ACH-056": conditionMet = totalSubjects100 >= 3; break;
            case "ACH-057": conditionMet = totalSubjects100 >= 1; break;
            case "ACH-058": conditionMet = maxPyqSubjectSolved >= 100; break; // accuracy dropped
            case "ACH-059": conditionMet = totalSubjects100 >= 1 && subjectsWith100PercentPYQ >= 1 && subjectTestsDone > 0; break;
            case "ACH-060": conditionMet = longestStreak >= 10; break;
            case "ACH-061": conditionMet = totalSubjects100 >= 1 && subjectsWith100PercentPYQ >= 1; break;
            case "ACH-062": conditionMet = mocksDone >= 3; break;
            case "ACH-063": conditionMet = totalHours >= 250; break;
            case "ACH-064": conditionMet = longestStreak >= 50; break;
            case "ACH-065": conditionMet = Object.values(subjectCompletions).some(s => s.allTopicsComplete); break;
            case "ACH-066": conditionMet = totalPyqSolved >= 500; break;
            case "ACH-067": conditionMet = sessionLengths.filter(l => l >= 1).length >= 20; break; // 60 mins = 1 hr
            case "ACH-068": conditionMet = Object.values(subjectStudyDates).some(dates => dates.size >= 14); break;
            case "ACH-069": conditionMet = Object.keys(state.achievements.unlocked).length >= 10; break;
            case "ACH-070": conditionMet = state.achievements.xp >= 1000; break;
            case "ACH-071": conditionMet = rev1 >= 5; break;
            case "ACH-072": conditionMet = totalSubjects100 >= 4 && totalHours >= 150; break;
            case "ACH-073": conditionMet = totalHours >= 500; break;
            case "ACH-074": conditionMet = totalHours >= 750; break;
            case "ACH-075": conditionMet = longestStreak >= 75; break;
            case "ACH-076": conditionMet = longestStreak >= 100; break;
            case "ACH-077": conditionMet = totalPyqSolved >= 1000; break;
            case "ACH-078": conditionMet = subjectsWith100PercentPYQ >= 3; break;
            case "ACH-079": conditionMet = subjectTestsDone >= 3; break;
            case "ACH-080": conditionMet = mocksDone >= 10; break;
            case "ACH-081": conditionMet = rev2 >= revTotal; break;
            case "ACH-082": conditionMet = totalSubjects100 >= 5 && subjectsWith100PercentPYQ >= 5; break;
            case "ACH-083": conditionMet = maxPyqSubjectSolved >= 500; break; // accuracy dropped
            case "ACH-084": conditionMet = totalHours >= 10; break; // simplified
            case "ACH-085": conditionMet = totalSubjects100 >= 3 && subjectsWith100PercentPYQ >= 3; break;
            case "ACH-086": conditionMet = longestStreak >= 28; break;
            case "ACH-087": conditionMet = sessionLengths.some(l => l >= 4); break;
            case "ACH-088": conditionMet = state.achievements.xp >= 2500; break;
            case "ACH-089": conditionMet = Object.keys(state.achievements.unlocked).length >= 25; break; // count proxy
            case "ACH-090": conditionMet = mocksDone >= 5; break;
            case "ACH-091": conditionMet = subjectCompletions['general_aptitude']?.progress >= 100; break;
            case "ACH-092": conditionMet = subjectCompletions['engineering_mathematics']?.progress >= 100; break;
            case "ACH-093": conditionMet = subjectCompletions['structural_engineering']?.progress >= 100; break;
            case "ACH-094": conditionMet = subjectCompletions['geotechnical_engineering']?.progress >= 100; break;
            case "ACH-095": conditionMet = subjectCompletions['water_resources_engineering']?.progress >= 100; break;
            case "ACH-096": conditionMet = subjectCompletions['environmental_engineering']?.progress >= 100; break;
            case "ACH-097": conditionMet = subjectCompletions['transportation_engineering']?.progress >= 100; break;
            case "ACH-098": conditionMet = subjectCompletions['geomatics_engineering']?.progress >= 100; break;
            case "ACH-099": conditionMet = subjectCompletions['construction_materials']?.progress >= 100; break;
            case "ACH-100": conditionMet = allPyqTargetMet; break;
            case "ACH-101": conditionMet = allTestsMet; break;
            case "ACH-102": conditionMet = allMocksMet; break;
            case "ACH-103": conditionMet = allRevMet; break;
            case "ACH-104": conditionMet = totalHours >= 1000; break;
            case "ACH-105": conditionMet = readiness >= 100; break;
            case "ACH-106": conditionMet = totalHours >= 1300; break;
            case "ACH-107": conditionMet = longestStreak >= 365; break;
            case "ACH-108": conditionMet = rev1 > 0; break;
            case "ACH-109": conditionMet = maxPyqSubjectSolved >= 100; break;
            case "ACH-110": conditionMet = readiness >= 75; break;
            
            default:
                // Catch any remaining
                if (ach.name.includes('Hours') || ach.name.includes('Grind')) {
                    const match = ach.unlock_condition.match(/([0-9,]+)/);
                    if (match) {
                        const hrs = parseInt(match[1].replace(',', ''));
                        if (totalHours >= hrs) conditionMet = true;
                    }
                }
                break;
        }

        if (conditionMet) {
            award(ach);
        }
    });

    // Level calculation: 1 level per 250 XP
    state.achievements.level = 1 + Math.floor(state.achievements.xp / 250);

    return unlockedNow;
}

function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
