// Additional FM voices for melodic/FX accents. Each voice mirrors the drum voices API:
// constructor(ac), get out(), and trigger(time = ac.currentTime, accent = false)
// Exposed params per voice: volume (gain), length (0–1 decay scaler), tone (0–1 timbre control).

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mapLength = (length, minMs, maxMs) => {
  const t = clamp(length ?? 0.5, 0, 1);
  return minMs + (maxMs - minMs) * t;
};
const semitoneRatio = (semitones) => Math.pow(2, semitones / 12);

class WobblyBirdcall {
  volume = 0.4;
  length = 0.5;
  tone = 0.5;
  baseFreq = 1000;

  constructor(ac) {
    this.ac = ac;
    this.output = ac.createGain();
    this.output.gain.value = 1;

    this.carrier = ac.createOscillator();
    this.carrier.type = "sine";
    this.carrierGain = ac.createGain();
    this.carrierGain.gain.value = 0;
    this.carrier.connect(this.carrierGain);
    this.carrierGain.connect(this.output);

    this.modOsc = ac.createOscillator();
    this.modOsc.type = "sine";
    this.modGain = ac.createGain();
    this.modGain.gain.value = 0;
    this.modOsc.connect(this.modGain);
    this.modGain.connect(this.carrier.frequency);

    this.vibrato = ac.createOscillator();
    this.vibrato.type = "sine";
    this.vibrato.frequency.value = 8;
    this.vibratoGain = ac.createGain();
    this.vibratoGain.gain.value = 0;
    this.vibrato.connect(this.vibratoGain);
    this.vibratoGain.connect(this.carrier.frequency);

    this.carrier.start();
    this.modOsc.start();
    this.vibrato.start();
  }

  get out() {
    return this.output;
  }

  trigger(time = this.ac.currentTime, accent = false) {
    const decayMs = mapLength(this.length, 80, 250);
    const amp = clamp(this.volume, 0, 1) * (accent ? 1.5 : 1);
    const freq = clamp(this.baseFreq, 700, 1500);

    const vibratoDepthSemis = clamp(this.tone, 0, 1) * 1.0; // up to ~1 semitone
    const vibratoDepthHz = freq * (semitoneRatio(vibratoDepthSemis) - 1);
    this.vibrato.frequency.setValueAtTime(6 + this.tone * 6, time);
    this.vibratoGain.gain.setValueAtTime(vibratoDepthHz, time);

    const fmDeviation = 50 + this.tone * 300; // 50–350 Hz
    this.modOsc.frequency.setValueAtTime(freq, time);
    this.modGain.gain.cancelScheduledValues(time);
    this.modGain.gain.setValueAtTime(fmDeviation, time);
    this.modGain.gain.exponentialRampToValueAtTime(fmDeviation * 0.35, time + decayMs * 0.6 / 1000);

    this.carrier.frequency.setValueAtTime(freq, time);

    this.carrierGain.gain.cancelScheduledValues(time);
    this.carrierGain.gain.setValueAtTime(0.0001, time);
    this.carrierGain.gain.linearRampToValueAtTime(amp, time + 0.002);
    this.carrierGain.gain.exponentialRampToValueAtTime(0.0001, time + decayMs / 1000);
  }
}

class UpwardChirper {
  volume = 0.35;
  length = 0.5;
  tone = 0.5;
  baseFreq = 600;

  constructor(ac) {
    this.ac = ac;
    this.output = ac.createGain();
    this.output.gain.value = 1;

    this.carrier = ac.createOscillator();
    this.carrier.type = "sine";
    this.carrierGain = ac.createGain();
    this.carrierGain.gain.value = 0;
    this.carrier.connect(this.carrierGain);
    this.carrierGain.connect(this.output);

    this.modOsc = ac.createOscillator();
    this.modOsc.type = "sine";
    this.modGain = ac.createGain();
    this.modGain.gain.value = 0;
    this.modOsc.connect(this.modGain);
    this.modGain.connect(this.carrier.frequency);

    this.carrier.start();
    this.modOsc.start();
  }

  get out() {
    return this.output;
  }

  trigger(time = this.ac.currentTime, accent = false) {
    const decayMs = mapLength(this.length, 40, 120);
    const sweepSemis = 3 + this.tone * 15; // 3–18 semitones up
    const sweepDur = 0.03 + mapLength(this.length, 0, 0.06); // 30–90 ms
    const freq = clamp(this.baseFreq, 400, 900);
    const startFreq = freq / semitoneRatio(sweepSemis);
    const dev = 100 + this.tone * 500; // 100–600 Hz deviation
    const amp = clamp(this.volume, 0, 1) * (accent ? 1.5 : 1);

    this.modOsc.frequency.setValueAtTime(freq * 3, time);
    this.modGain.gain.cancelScheduledValues(time);
    this.modGain.gain.setValueAtTime(dev, time);
    this.modGain.gain.exponentialRampToValueAtTime(dev * 0.3, time + decayMs * 0.6 / 1000);

    this.carrier.frequency.cancelScheduledValues(time);
    this.carrier.frequency.setValueAtTime(startFreq, time);
    this.carrier.frequency.exponentialRampToValueAtTime(freq, time + sweepDur);

    this.carrierGain.gain.cancelScheduledValues(time);
    this.carrierGain.gain.setValueAtTime(0.0001, time);
    this.carrierGain.gain.linearRampToValueAtTime(amp, time + 0.002);
    this.carrierGain.gain.exponentialRampToValueAtTime(0.0001, time + decayMs / 1000);
  }
}

class HarshPluck {
  volume = 0.4;
  length = 0.5;
  tone = 0.5;
  baseFreq = 320;

  constructor(ac) {
    this.ac = ac;
    this.output = ac.createGain();
    this.output.gain.value = 1;

    this.carrier = ac.createOscillator();
    this.carrier.type = "sine";
    this.carrierGain = ac.createGain();
    this.carrierGain.gain.value = 0;
    this.carrier.connect(this.carrierGain);
    this.carrierGain.connect(this.output);

    this.modOsc = ac.createOscillator();
    this.modOsc.type = "sawtooth";
    this.modGain = ac.createGain();
    this.modGain.gain.value = 0;
    this.modOsc.connect(this.modGain);
    this.modGain.connect(this.carrier.frequency);

    // Feedback loop for grit
    this.feedbackGain = ac.createGain();
    this.feedbackGain.gain.value = 0;
    this.modOsc.connect(this.feedbackGain);
    this.feedbackGain.connect(this.modOsc.frequency);

    this.carrier.start();
    this.modOsc.start();
  }

  get out() {
    return this.output;
  }

  trigger(time = this.ac.currentTime, accent = false) {
    const decayMs = mapLength(this.length, 25, 220);
    const freq = clamp(this.baseFreq, 250, 500);
    const amp = clamp(this.volume, 0, 1) * (accent ? 1.5 : 1);

    const feedback = freq * clamp(this.tone, 0, 1) * 0.7; // 0–0.7 * freq Hz
    this.feedbackGain.gain.setValueAtTime(feedback, time);

    const dev = 120 + this.tone * 600; // modulation deviation
    this.modOsc.frequency.setValueAtTime(freq * 1.02, time);
    this.modGain.gain.cancelScheduledValues(time);
    this.modGain.gain.setValueAtTime(dev, time);
    this.modGain.gain.exponentialRampToValueAtTime(dev * 0.25, time + decayMs * 0.5 / 1000);

    this.carrier.frequency.setValueAtTime(freq, time);

    this.carrierGain.gain.cancelScheduledValues(time);
    this.carrierGain.gain.setValueAtTime(0.0001, time);
    this.carrierGain.gain.linearRampToValueAtTime(amp, time + 0.002);
    this.carrierGain.gain.exponentialRampToValueAtTime(0.0001, time + decayMs / 1000);
  }
}

class HighOctavePluck {
  volume = 0.35;
  length = 0.5;
  tone = 0.5;
  baseFreq = 620;
  ratio = 7; // between 6–8-ish

  constructor(ac) {
    this.ac = ac;
    this.output = ac.createGain();
    this.output.gain.value = 1;

    this.carrier = ac.createOscillator();
    this.carrier.type = "sine";
    this.carrierGain = ac.createGain();
    this.carrierGain.gain.value = 0;
    this.carrier.connect(this.carrierGain);
    this.carrierGain.connect(this.output);

    this.modOsc = ac.createOscillator();
    this.modOsc.type = "sine";
    this.modGain = ac.createGain();
    this.modGain.gain.value = 0;
    this.modOsc.connect(this.modGain);
    this.modGain.connect(this.carrier.frequency);

    this.carrier.start();
    this.modOsc.start();
  }

  get out() {
    return this.output;
  }

  trigger(time = this.ac.currentTime, accent = false) {
    const decayMs = mapLength(this.length, 30, 200);
    const freq = clamp(this.baseFreq, 450, 950);
    const amp = clamp(this.volume, 0, 1) * (accent ? 1.5 : 1);
    const dev = 100 + this.tone * 1100; // wider brightness swing

    this.modOsc.frequency.setValueAtTime(freq * clamp(this.ratio, 5.5, 8.5), time);
    this.modGain.gain.cancelScheduledValues(time);
    this.modGain.gain.setValueAtTime(dev, time);
    this.modGain.gain.exponentialRampToValueAtTime(dev * 0.2, time + decayMs * 0.5 / 1000);

    this.carrier.frequency.setValueAtTime(freq, time);

    this.carrierGain.gain.cancelScheduledValues(time);
    this.carrierGain.gain.setValueAtTime(0.0001, time);
    this.carrierGain.gain.linearRampToValueAtTime(amp, time + 0.002);
    this.carrierGain.gain.exponentialRampToValueAtTime(0.0001, time + decayMs / 1000);
  }
}

class BendyMetallicFlare {
  volume = 0.35;
  length = 0.5;
  tone = 0.5;
  baseFreq = 1000;

  constructor(ac) {
    this.ac = ac;
    this.output = ac.createGain();
    this.output.gain.value = 1;

    this.carrier = ac.createOscillator();
    this.carrier.type = "sine";
    this.carrierGain = ac.createGain();
    this.carrierGain.gain.value = 0;
    this.carrier.connect(this.carrierGain);
    this.carrierGain.connect(this.output);

    this.modOsc = ac.createOscillator();
    this.modOsc.type = "sine";
    this.modGain = ac.createGain();
    this.modGain.gain.value = 0;
    this.modOsc.connect(this.modGain);
    this.modGain.connect(this.carrier.frequency);

    this.carrier.start();
    this.modOsc.start();
  }

  get out() {
    return this.output;
  }

  trigger(time = this.ac.currentTime, accent = false) {
    const decayMs = mapLength(this.length, 150, 400);
    const freq = clamp(this.baseFreq, 800, 1500);
    const amp = clamp(this.volume, 0, 1) * (accent ? 1.5 : 1);
    const startRatio = 1.5 - clamp(this.tone, 0, 1) * 0.2; // 1.5 → 1.3
    const endRatio = 1.7 + clamp(this.tone, 0, 1) * 0.4;   // 1.7 → 2.1
    const glideMs = 80 + clamp(this.tone, 0, 1) * 170;     // 80–250 ms
    const dev = 180 + this.tone * 700; // brighter with tone

    this.modOsc.frequency.setValueAtTime(freq * startRatio, time);
    this.modOsc.frequency.linearRampToValueAtTime(freq * endRatio, time + glideMs / 1000);

    this.modGain.gain.cancelScheduledValues(time);
    this.modGain.gain.setValueAtTime(dev, time);
    this.modGain.gain.exponentialRampToValueAtTime(dev * 0.25, time + decayMs * 0.6 / 1000);

    this.carrier.frequency.setValueAtTime(freq, time);

    this.carrierGain.gain.cancelScheduledValues(time);
    this.carrierGain.gain.setValueAtTime(0.0001, time);
    this.carrierGain.gain.linearRampToValueAtTime(amp, time + 0.002);
    this.carrierGain.gain.exponentialRampToValueAtTime(0.0001, time + decayMs / 1000);
  }
}

class FMBubblePop {
  volume = 0.35;
  length = 0.5;
  tone = 0.5;
  baseFreq = 200;

  constructor(ac) {
    this.ac = ac;
    this.output = ac.createGain();
    this.output.gain.value = 1;

    this.carrier = ac.createOscillator();
    this.carrier.type = "sine";
    this.carrierGain = ac.createGain();
    this.carrierGain.gain.value = 0;
    this.carrier.connect(this.carrierGain);
    this.carrierGain.connect(this.output);

    this.modOsc = ac.createOscillator();
    this.modOsc.type = "sine";
    this.modGain = ac.createGain();
    this.modGain.gain.value = 0;
    this.modOsc.connect(this.modGain);
    this.modGain.connect(this.carrier.frequency);

    this.carrier.start();
    this.modOsc.start();
  }

  get out() {
    return this.output;
  }

  trigger(time = this.ac.currentTime, accent = false) {
    const decayMs = mapLength(this.length, 50, 200);
    const modDecayMs = 5 + clamp(this.tone, 0, 1) * 15; // 5–20 ms for squelch
    const freq = clamp(this.baseFreq, 150, 300);
    const amp = clamp(this.volume, 0, 1) * (accent ? 1.5 : 1);
    const ratio = 10 + clamp(this.tone, 0, 1) * 4; // 10–14
    const dev = 100 + this.tone * 1100; // 100–1200 Hz deviation

    this.modOsc.frequency.setValueAtTime(freq * ratio, time);
    this.modGain.gain.cancelScheduledValues(time);
    this.modGain.gain.setValueAtTime(dev, time);
    this.modGain.gain.exponentialRampToValueAtTime(5, time + modDecayMs / 1000);

    this.carrier.frequency.setValueAtTime(freq, time);

    this.carrierGain.gain.cancelScheduledValues(time);
    this.carrierGain.gain.setValueAtTime(0.0001, time);
    this.carrierGain.gain.linearRampToValueAtTime(amp, time + 0.002);
    this.carrierGain.gain.exponentialRampToValueAtTime(0.0001, time + decayMs / 1000);
  }
}

export {
  WobblyBirdcall,
  UpwardChirper,
  HarshPluck,
  HighOctavePluck,
  BendyMetallicFlare,
  FMBubblePop
};
