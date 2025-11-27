import {
  WobblyBirdcall,
  UpwardChirper,
  HarshPluck,
  HighOctavePluck,
  BendyMetallicFlare,
  FMBubblePop
} from './fmVoices';

const createPool = (VoiceCtor, ac, master, voicesPerSound = 4) => {
  const pool = [];
  for (let i = 0; i < voicesPerSound; i++) {
    const v = new VoiceCtor(ac);
    v.out.connect(master);
    pool.push(v);
  }
  let index = 0;
  return {
    next() {
      const voice = pool[index];
      index = (index + 1) % pool.length;
      return voice;
    },
    dispose() {
      pool.forEach(v => {
        if (v.out && v.out.disconnect) v.out.disconnect();
      });
    }
  };
};

export const createSynthEngine = () => {
  const ac = new AudioContext();
  const master = ac.createGain();
  master.gain.value = 0.9;
  master.connect(ac.destination);
  let closed = false;

  const pools = {
    birdcall: createPool(WobblyBirdcall, ac, master),
    chirper: createPool(UpwardChirper, ac, master),
    harshPluck: createPool(HarshPluck, ac, master),
    highPluck: createPool(HighOctavePluck, ac, master),
    flare: createPool(BendyMetallicFlare, ac, master),
    bubble: createPool(FMBubblePop, ac, master)
  };

  const safeResume = () => {
    if (closed || ac.state === 'closed') return;
    ac.resume();
  };

  document.addEventListener('click', safeResume, { once: true });
  document.addEventListener('keydown', safeResume, { once: true });

  return {
    triggerSound(soundId, params = {}, time = ac.currentTime) {
      if (closed || ac.state === 'closed') return;
      const pool = pools[soundId];
      const voice = pool?.next();
      if (!voice) return;
      Object.entries(params).forEach(([key, val]) => {
        if (key in voice) {
          voice[key] = val;
        }
      });
      voice.trigger(time);
    },
    currentTime: () => ac.currentTime,
    dispose: () => {
      closed = true;
      document.removeEventListener('click', safeResume);
      document.removeEventListener('keydown', safeResume);
      Object.values(pools).forEach(pool => pool.dispose());
      ac.close();
    }
  };
};
