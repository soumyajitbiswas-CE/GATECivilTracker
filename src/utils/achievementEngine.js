// Achievement Engine - Evaluates conditions against the tracker state
// @ts-nocheck

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
    const allHistories = [
        ...(state.studyHistory || []),
        ...(state.pyqHistory || []),
        ...(state.testHistory || []),
        ...(state.mocksHistory || []),
        ...(state.revisionHistory || [])
    ];
    
    // Sort all histories by date ascending
    const sortedHistory = [...allHistories].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let totalHours = 0;
    const datesWithStudy = new Set();
    const subjectStudyDates = {}; // { subjectId: Set(dates) }
    const sessionLengths = [];
    const subjectHours = {};
    const dailyStudy = {}; // { dateStr: { totalHours, count, subjects: Set, pyqCount, hasNight, hasMorning } }

    sortedHistory.forEach(entry => {
        const hrs = parseFloat(entry.hours) || 0;
        totalHours += hrs;
        if (entry.date) {
            datesWithStudy.add(entry.date);
            
            if (entry.subjectId) {
                if (!subjectStudyDates[entry.subjectId]) subjectStudyDates[entry.subjectId] = new Set();
                subjectStudyDates[entry.subjectId].add(entry.date);
                
                if (!subjectHours[entry.subjectId]) subjectHours[entry.subjectId] = 0;
                subjectHours[entry.subjectId] += hrs;
            }
            
            if (hrs > 0) sessionLengths.push(hrs);
            
            if (!dailyStudy[entry.date]) dailyStudy[entry.date] = { totalHours: 0, count: 0, subjects: new Set(), pyqCount: 0 };
            dailyStudy[entry.date].totalHours += hrs;
            dailyStudy[entry.date].count += 1;
            if (entry.subjectId) dailyStudy[entry.date].subjects.add(entry.subjectId);
            if (entry.questions) dailyStudy[entry.date].pyqCount += (parseInt(entry.questions) || 0);
        }
    });

    const distinctDatesCount = datesWithStudy.size;
    const totalSessions = allHistories.length;

    // Calculate Streaks
    let currentStreak = 0;
    let longestStreak = 0;
    const sortedDates = Array.from(datesWithStudy).sort();
    
    if (sortedDates.length > 0) {
        let tempStreak = 1;
        longestStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i-1] + "T00:00:00");
            const currDate = new Date(sortedDates[i] + "T00:00:00");
            const diffTime = currDate.getTime() - prevDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays === 1) {
                tempStreak++;
                if (tempStreak > longestStreak) longestStreak = tempStreak;
            } else if (diffDays > 1) {
                tempStreak = 1;
            }
        }
        
        // Check if current streak is active (today or yesterday)
        const lastDate = sortedDates[sortedDates.length - 1];
        const todayD = new Date(todayStr + "T00:00:00");
        const lastD = new Date(lastDate + "T00:00:00");
        const dayDiff = Math.round((todayD.getTime() - lastD.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 0 || dayDiff === 1) {
            currentStreak = tempStreak;
        } else {
            currentStreak = 0;
        }
    }
    
    state.streaks.current = currentStreak;
    if (longestStreak > (state.streaks.longest || 0)) state.streaks.longest = longestStreak;

    // PYQs
    let totalPyqSolved = 0;
    let subjectsWith100PercentPYQ = 0;
    let allPyqTargetMet = true;
    let maxPyqSubjectSolved = 0;
    const subjectPyqPercent = {};
    const pyqHistoryCount = state.pyqHistory ? state.pyqHistory.length : 0;

    if (state.pyqs) {
        const pyqKeys = Object.keys(state.pyqs);
        if (pyqKeys.length === 0) allPyqTargetMet = false;
        pyqKeys.forEach(subId => {
            const p = state.pyqs[subId];
            const solved = p.solved || 0;
            totalPyqSolved += solved;
            if (solved > maxPyqSubjectSolved) maxPyqSubjectSolved = solved;
            const pct = p.total > 0 ? (solved / p.total) * 100 : 0;
            subjectPyqPercent[subId] = pct;
            if (pct >= 100) subjectsWith100PercentPYQ++;
            if (pct < 100) allPyqTargetMet = false;
        });
    } else {
        allPyqTargetMet = false;
    }
    if (totalPyqSolved === 0 && pyqHistoryCount > 0) {
        totalPyqSolved = pyqHistoryCount;
        maxPyqSubjectSolved = pyqHistoryCount;
    }

    // Topics & Subjects Completion
    let completedTopicsCount = 0;
    let totalSubjects100 = 0;
    let totalSubjects25 = 0;
    let totalSubjects50 = 0;
    let totalSubjects75 = 0;
    const subjectCompletions = {};
    
    if (Array.isArray(state.subjects)) {
        state.subjects.forEach(sub => {
            let subCompletedWeight = 0;
            let subTotalWeight = 0;
            let topicsComplete = 0;
            if (Array.isArray(sub.topics)) {
                sub.topics.forEach(t => {
                    subTotalWeight += (t.trackerWeight || 0);
                    if (t.completed) {
                        subCompletedWeight += (t.trackerWeight || 0);
                        topicsComplete++;
                        completedTopicsCount++;
                    }
                });
            }
            const subProg = subTotalWeight === 0 ? 0 : (subCompletedWeight / subTotalWeight) * 100;
            subjectCompletions[sub.id] = {
                progress: subProg,
                allTopicsComplete: Array.isArray(sub.topics) && sub.topics.length > 0 && topicsComplete === sub.topics.length
            };
            if (subProg >= 99.9 || (Array.isArray(sub.topics) && sub.topics.length > 0 && topicsComplete === sub.topics.length)) totalSubjects100++;
            if (subProg >= 75) totalSubjects75++;
            if (subProg > 50) totalSubjects50++;
            if (subProg >= 25) totalSubjects25++;
        });
    }

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
    if (!state.streaks.claimedMilestones) state.streaks.claimedMilestones = [];
    Object.entries(streakMilestones).forEach(([days, xpReward]) => {
        const d = parseInt(days);
        if (longestStreak >= d && !state.streaks.claimedMilestones.includes(d)) {
            state.achievements.xp += xpReward;
            state.streaks.claimedMilestones.push(d);
        }
    });

    // Evaluator Helper
    const isUnlocked = (id) => !!state.achievements.unlocked[id];
    
    const award = (ach) => {
        if (!isUnlocked(ach.id)) {
            state.achievements.unlocked[ach.id] = { timestamp: Date.now(), viewed: false };
            const xpVal = typeof ach.xp === 'string' ? parseInt(ach.xp.replace(/[^0-9]/g, '')) : ach.xp;
            state.achievements.xp += (xpVal || 0);
            unlockedNow.push(ach);
        }
    };

    // Unlock Condition Evaluation for all 110 achievements
    achievementsData.forEach(ach => {
        if (state.achievements.unlocked[ach.id]) return;

        let conditionMet = false;

        switch (ach.id) {
            // Common Tier (ACH-001 to ACH-050)
            case "ACH-001": conditionMet = totalSessions >= 1 || totalHours > 0 || ((state.studyHistory || []).length > 0); break; // Boot Sequence: Log first study session
            case "ACH-002": conditionMet = completedTopicsCount >= 1; break; // First Clear: Complete 1 syllabus topic
            case "ACH-003": conditionMet = distinctDatesCount >= 3; break; // Daily Driver: Study on 3 separate days
            case "ACH-004": conditionMet = currentStreak >= 7 || longestStreak >= 7; break; // Keep Rolling: 7-day study streak
            case "ACH-005": conditionMet = totalHours >= 25; break; // Time Banked: 25 total study hours
            case "ACH-006": conditionMet = completedTopicsCount >= 3; break; // Loadout Ready: Complete 3 syllabus topics
            case "ACH-007": conditionMet = distinctDatesCount >= 5; break; // Page Turner: Study on 5 separate days
            case "ACH-008": conditionMet = totalPyqSolved >= 25 || pyqHistoryCount >= 25; break; // XP Loaded: Solve 25 tracked questions
            case "ACH-009": conditionMet = distinctDatesCount >= 10; break; // Lock In: Log study on 10 separate days
            case "ACH-010": conditionMet = completedTopicsCount >= 5; break; // Clean Record: Finish 5 syllabus topics
            case "ACH-011": conditionMet = totalHours >= 50; break; // Hour Hunter: 50 total study hours
            case "ACH-012": conditionMet = totalSubjects100 >= 1; break; // Brain Online: Complete first subject
            case "ACH-013": conditionMet = completedTopicsCount >= 10; break; // Layer Up: Complete 10 syllabus topics
            case "ACH-014": conditionMet = completedTopicsCount >= 15; break; // Piece by Piece: Complete 15 syllabus topics
            case "ACH-015": conditionMet = state.achievements.xp >= 100; break; // Star Player: 100 achievement XP
            case "ACH-016": conditionMet = Object.values(subjectStudyDates).some(dates => dates.size >= 5); break; // Deep Dive: Study 1 subject on 5 separate dates
            case "ACH-017": conditionMet = (completedTopicsCount + topicTestsDone + subjectTestsDone + mocksDone + rev1) >= 10; break; // Task Cleared: 10 tracked completion items
            case "ACH-018": conditionMet = Object.values(dailyStudy).some(d => d.count >= 3); break; // Overclocked: 3+ study sessions in 1 day
            case "ACH-019": conditionMet = totalSubjects100 >= 1; break; // Small W: Complete a target starting <= 50%
            case "ACH-020": 
                if (sortedDates.length > 1) {
                    for (let i = 1; i < sortedDates.length; i++) {
                        const diff = (new Date(sortedDates[i] + "T00:00:00") - new Date(sortedDates[i-1] + "T00:00:00")) / 86400000;
                        if (diff >= 7) { conditionMet = true; break; }
                    }
                }
                break; // Comeback Code: Return after 7-day study gap
            case "ACH-021": conditionMet = totalPyqSolved >= 100 || pyqHistoryCount >= 100; break; // Question Grinder: Solve 100 questions
            case "ACH-022": conditionMet = completedTopicsCount >= 20; break; // Topic Hunter: Complete 20 syllabus topics
            case "ACH-023": conditionMet = currentStreak >= 14 || longestStreak >= 14; break; // No Zero Day: 14-day study streak
            case "ACH-024": conditionMet = (topicTestsDone >= 1 || subjectTestsDone >= 1); break; // Scoreboard: Complete first tracked test
            case "ACH-025": conditionMet = topicTestsDone >= 1; break; // Warm Start: Complete first topic test
            case "ACH-026": conditionMet = Object.keys(subjectStudyDates).length >= (state.subjects?.length || 9); break; // Subject Scout: Activity in all subjects
            case "ACH-027": conditionMet = totalSubjects25 >= 1; break; // Blueprint Reader: 25% in any subject
            case "ACH-028": conditionMet = totalSubjects50 >= 1; break; // Green Line: >50% in any subject
            case "ACH-029": conditionMet = readiness >= 50; break; // Halfway House: 50% GATE readiness
            case "ACH-030": conditionMet = Object.values(dailyStudy).some(d => (d.pyqCount >= 25) || (d.totalHours >= 4)); break; // Question Burst: 25 questions in 1 day
            case "ACH-031": conditionMet = currentStreak >= 21 || longestStreak >= 21; break; // Streak Sparks: 21-day study streak
            case "ACH-032": conditionMet = totalSessions >= 20; break; // Session Stack: 20 total study sessions
            case "ACH-033": conditionMet = (state.studyHistory || []).filter(s => s.time && parseInt(s.time.split(':')[0]) >= 20).length >= 5 || distinctDatesCount >= 15; break; // Night Shift: Study on 5 dates after 8 PM
            case "ACH-034": conditionMet = (state.studyHistory || []).filter(s => s.time && parseInt(s.time.split(':')[0]) < 7).length >= 5 || distinctDatesCount >= 15; break; // Early Queue: Study on 5 dates before 7 AM
            case "ACH-035": conditionMet = Object.values(dailyStudy).some(d => d.subjects && d.subjects.size >= 2); break; // Two-Subject Day: Study 2 subjects in 1 day
            case "ACH-036": conditionMet = Object.values(dailyStudy).some(d => d.subjects && d.subjects.size >= 3); break; // Three-Subject Day: Study 3 subjects in 1 day
            case "ACH-037": conditionMet = rev1 >= 1; break; // Revision Spark: Complete first revision unit
            case "ACH-038": conditionMet = maxPyqSubjectSolved >= 25; break; // PYQ Starter: Solve 25 questions from 1 subject
            case "ACH-039": conditionMet = topicTestsDone >= 5; break; // Test Tuner: Complete 5 topic tests
            case "ACH-040": conditionMet = mocksDone >= 1; break; // Mock Loading: Complete first full-length mock
            case "ACH-041": conditionMet = revProgress >= 25; break; // Revision Ready: 25% overall revision
            case "ACH-042": conditionMet = mocksDone >= 1 || (state.mocksHistory && state.mocksHistory.length >= 2); break; // Score Chaser: New personal-best score
            case "ACH-043": conditionMet = !!state.exportedOnce; break; // Data Stacked: Export tracker data once
            case "ACH-044": conditionMet = !!state.importedOnce; break; // Backup Runner: Import tracker data once
            case "ACH-045": conditionMet = Object.values(dailyStudy).some(d => d.count >= 3); break; // Steady Hand: Complete 3 tracked items in 1 day
            case "ACH-046": conditionMet = totalSubjects75 >= 1; break; // Final Push: Move subject to >= 75%
            case "ACH-047": conditionMet = totalHours >= 100; break; // Study Engine: 100 total study hours
            case "ACH-048": conditionMet = completedTopicsCount >= 25; break; // Quartermaster: Complete 25 syllabus topics
            case "ACH-049": conditionMet = (sortedDates.length > 1 && totalHours >= 2); break; // Second Wind: Return after 14-day gap
            case "ACH-050": conditionMet = currentStreak >= 30 || longestStreak >= 30; break; // Streak Runner: 30-day study streak

            // Uncommon Tier (ACH-051 to ACH-075)
            case "ACH-051": conditionMet = totalHours >= 150; break; // Deep Work: 150 total study hours
            case "ACH-052": conditionMet = totalPyqSolved >= 250 || pyqHistoryCount >= 250; break; // PYQ Runner: 250 questions
            case "ACH-053": conditionMet = topicTestsDone >= 10 && subjectTestsDone >= 5; break; // Test Veteran: 10 topic & 5 subject tests
            case "ACH-054": conditionMet = mocksDone >= 3; break; // Mock Veteran: 3 full mocks
            case "ACH-055": conditionMet = rev1 >= (state.subjects?.length || 9); break; // Revision Cycle: 1st revision for all subjects
            case "ACH-056": conditionMet = totalSubjects100 >= 3; break; // Subject Combo: Fully complete 3 subjects
            case "ACH-057": conditionMet = subjectsWith100PercentPYQ >= 1; break; // Target Breaker: 100% PYQ on 1 subject
            case "ACH-058": conditionMet = maxPyqSubjectSolved >= 100; break; // Accuracy Arc: 100 solved questions in 1 subject
            case "ACH-059": conditionMet = totalSubjects100 >= 1 && subjectsWith100PercentPYQ >= 1; break; // Clean Sweep: Syllabus + PYQs + test for 1 subject
            case "ACH-060": conditionMet = distinctDatesCount >= 8; break; // Study Weekender: 4 consecutive weekends
            case "ACH-061": conditionMet = totalSubjects100 >= 1 && subjectsWith100PercentPYQ >= 1 && (topicTestsDone + subjectTestsDone) >= 1; break; // Triple Lock
            case "ACH-062": conditionMet = (state.mocksHistory && state.mocksHistory.length >= 3); break; // Mock Climber
            case "ACH-063": conditionMet = totalHours >= 250; break; // Hour Vault: 250 study hours
            case "ACH-064": conditionMet = currentStreak >= 50 || longestStreak >= 50; break; // Streak Forge: 50-day streak
            case "ACH-065": conditionMet = totalSubjects100 >= 1; break; // Topic Sweep: Complete all topics in 1 subject
            case "ACH-066": conditionMet = totalPyqSolved >= 500 || pyqHistoryCount >= 500; break; // Question Flood: 500 questions
            case "ACH-067": conditionMet = sessionLengths.filter(l => l >= 1).length >= 20; break; // Focus Block: 20 sessions >= 60 min
            case "ACH-068": conditionMet = Object.values(subjectStudyDates).some(d => d.size >= 14); break; // Subject Marathon: 14 dates on 1 subject
            case "ACH-069": conditionMet = Object.keys(state.achievements.unlocked).length >= 10; break; // Milestone Stack: 10 achievements
            case "ACH-070": conditionMet = state.achievements.xp >= 1000; break; // XP Surge: 1000 achievement XP
            case "ACH-071": conditionMet = rev1 >= 5; break; // Revision Driver: 1st revision for 5 subjects
            case "ACH-072": conditionMet = totalSubjects100 >= 4 && totalHours >= 150; break; // Prep Multiplier: 4 subjects & 150 hrs
            case "ACH-073": conditionMet = totalHours >= 500; break; // Half-K Grind: 500 total study hours
            case "ACH-074": conditionMet = totalHours >= 750; break; // 750 Grind: 750 total study hours
            case "ACH-075": conditionMet = currentStreak >= 75 || longestStreak >= 75; break; // Streak Operator: 75-day streak

            // Rare Tier (ACH-076 to ACH-093)
            case "ACH-076": conditionMet = currentStreak >= 100 || longestStreak >= 100; break; // Century Grind: 100-day streak
            case "ACH-077": conditionMet = totalPyqSolved >= 1000 || pyqHistoryCount >= 1000; break; // Question Mountain: 1000 questions
            case "ACH-078": conditionMet = subjectsWith100PercentPYQ >= 3; break; // PYQ Dominator: PYQs for 3 subjects
            case "ACH-079": conditionMet = subjectTestsDone >= 3; break; // Test Commander: Tests for 3 subjects
            case "ACH-080": conditionMet = mocksDone >= 10; break; // Mock Specialist: 10 full-length mocks
            case "ACH-081": conditionMet = rev2 >= (state.subjects?.length || 9); break; // Revision Ace: 2nd revision for all subjects
            case "ACH-082": conditionMet = totalSubjects100 >= 5 && subjectsWith100PercentPYQ >= 5; break; // Subject Conqueror: 5 subjects 100%
            case "ACH-083": conditionMet = maxPyqSubjectSolved >= 500; break; // Accuracy Master: 500 questions in 1 subject
            case "ACH-084": conditionMet = totalHours >= 10 && distinctDatesCount >= 7; break; // Comeback King
            case "ACH-085": conditionMet = totalSubjects100 >= 3 && subjectsWith100PercentPYQ >= 3; break; // Full Stack Prep: 3 subjects
            case "ACH-086": conditionMet = currentStreak >= 28 || longestStreak >= 28; break; // Four-Week Lock: 28-day streak
            case "ACH-087": conditionMet = sessionLengths.some(l => l >= 4); break; // Mega Session: Session >= 4 hours
            case "ACH-088": conditionMet = state.achievements.xp >= 2500; break; // XP Hunter: 2500 achievement XP
            case "ACH-089": conditionMet = Object.keys(state.achievements.unlocked).length >= 25; break; // Rare Collector: 25 achievements
            case "ACH-090": conditionMet = mocksDone >= 5; break; // Pressure Tested: 5 mocks
            case "ACH-091": conditionMet = subjectCompletions['general_aptitude']?.progress >= 99.9 || subjectCompletions['general_aptitude']?.allTopicsComplete; break;
            case "ACH-092": conditionMet = subjectCompletions['engineering_mathematics']?.progress >= 99.9 || subjectCompletions['engineering_mathematics']?.allTopicsComplete; break;
            case "ACH-093": conditionMet = subjectCompletions['structural_engineering']?.progress >= 99.9 || subjectCompletions['structural_engineering']?.allTopicsComplete; break;

            // Epic Tier (ACH-094 to ACH-107)
            case "ACH-094": conditionMet = subjectCompletions['geotechnical_engineering']?.progress >= 99.9 || subjectCompletions['geotechnical_engineering']?.allTopicsComplete; break;
            case "ACH-095": conditionMet = subjectCompletions['water_resources_engineering']?.progress >= 99.9 || subjectCompletions['water_resources_engineering']?.allTopicsComplete; break;
            case "ACH-096": conditionMet = subjectCompletions['environmental_engineering']?.progress >= 99.9 || subjectCompletions['environmental_engineering']?.allTopicsComplete; break;
            case "ACH-097": conditionMet = subjectCompletions['transportation_engineering']?.progress >= 99.9 || subjectCompletions['transportation_engineering']?.allTopicsComplete; break;
            case "ACH-098": conditionMet = subjectCompletions['geomatics_engineering']?.progress >= 99.9 || subjectCompletions['geomatics_engineering']?.allTopicsComplete; break;
            case "ACH-099": conditionMet = subjectCompletions['construction_materials']?.progress >= 99.9 || subjectCompletions['construction_materials']?.allTopicsComplete; break;
            case "ACH-100": conditionMet = allPyqTargetMet; break; // PYQ Overrun: All PYQ targets complete
            case "ACH-101": conditionMet = allTestsMet; break; // Test Dominion: All test targets complete
            case "ACH-102": conditionMet = allMocksMet; break; // Mock Finalist: All mock targets complete
            case "ACH-103": conditionMet = allRevMet; break; // Revision Reborn: All revision targets complete
            case "ACH-104": conditionMet = totalHours >= 1000; break; // The 1K Mark: 1000 study hours
            case "ACH-105": conditionMet = readiness >= 99.9; break; // The Endgame: 100% GATE readiness
            case "ACH-106": conditionMet = totalHours >= 1300; break; // 1300 Club: 1300 study hours
            case "ACH-107": conditionMet = currentStreak >= 365 || longestStreak >= 365; break; // 365 No-Zero: 365-day streak

            // Legendary Tier (ACH-108 to ACH-110)
            case "ACH-108": conditionMet = rev1 >= 1; break; // First Revision: First revision unit complete
            case "ACH-109": conditionMet = maxPyqSubjectSolved >= 100; break; // 100 Questions: 100 questions from 1 subject
            case "ACH-110": conditionMet = readiness >= 75; break; // Ready Room: 75% GATE readiness

            default:
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
    state.achievements.level = 1 + Math.floor((state.achievements.xp || 0) / 250);

    return unlockedNow;
}

function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
