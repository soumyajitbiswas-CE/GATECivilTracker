// Sound synthesis for achievements
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function resumeAudio() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(freq, type, duration, vol, startTime) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    // Envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
}

export function playAchievementSound(rarity) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;

    if (rarity === 'Common') {
        // Short clean chime
        playTone(523.25, 'sine', 0.5, 0.3, now); // C5
        playTone(659.25, 'sine', 0.8, 0.3, now + 0.1); // E5
    } 
    else if (rarity === 'Uncommon') {
        // Two-stage tone
        playTone(440, 'triangle', 0.4, 0.3, now); // A4
        playTone(554.37, 'sine', 0.6, 0.3, now + 0.15); // C#5
        playTone(659.25, 'sine', 1.0, 0.4, now + 0.3); // E5
    }
    else if (rarity === 'Rare') {
        // Layered, deeper reward
        playTone(329.63, 'square', 0.3, 0.1, now); // E4
        playTone(440, 'triangle', 0.5, 0.2, now + 0.1); // A4
        playTone(523.25, 'sine', 0.8, 0.3, now + 0.25); // C5
        playTone(880, 'sine', 1.5, 0.4, now + 0.4); // A5
    }
    else if (rarity === 'Epic') {
        // Rich fanfare with low-end
        playTone(220, 'sawtooth', 0.8, 0.15, now); // A3
        playTone(277.18, 'triangle', 0.8, 0.2, now + 0.1); // C#4
        playTone(329.63, 'square', 0.8, 0.2, now + 0.2); // E4
        playTone(440, 'sine', 1.0, 0.3, now + 0.3); // A4
        playTone(880, 'sine', 2.0, 0.4, now + 0.45); // A5
    }
    else if (rarity === 'Legendary') {
        // Deep opening + rising + premium chime
        playTone(110, 'sawtooth', 1.0, 0.2, now); // A2
        playTone(164.81, 'square', 1.0, 0.15, now + 0.2); // E3
        playTone(220, 'triangle', 1.2, 0.2, now + 0.4); // A3
        playTone(440, 'sine', 1.5, 0.3, now + 0.6); // A4
        playTone(659.25, 'sine', 1.5, 0.3, now + 0.8); // E5
        playTone(1318.51, 'sine', 2.5, 0.5, now + 1.0); // E6
    }
}
