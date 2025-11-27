// Web Audio drum voices and engine

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const makeDistortionCurve = (amount = 20) => {
  const nSamples = 256;
  const curve = new Float32Array(nSamples);
  for (let i = 0; i < nSamples; ++i) {
    const x = (i * 2) / nSamples - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
};

const getWhiteNoiseBuffer = (ac, seconds = 2) => {
  const bufferSize = seconds * ac.sampleRate;
  const noiseBuffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
};

class BassDrum909 {
  frequency = 80;
  decay = 300;
  tone = 0.5;
  tone_decay = 20;
  volume = 1;
  env_amount = 2.5;
  env_duration = 50;
  filter_type = "lowpass";
  filter_freq = 3000;
  saturation = 1;

  constructor(ac) {
    this.ac = ac;
    this.output = this.ac.createGain();
    this.output.gain.value = 1;

    this.filter = new BiquadFilterNode(this.ac, {
      type: this.filter_type,
      frequency: this.filter_freq,
    });

    this.output.connect(this.filter);
    this.input = this.ac.createGain();
    this.input.gain.value = 0;
    this.input.connect(this.output);

    this.whiteNoise = this.ac.createBufferSource();
    this.whiteNoise.buffer = getWhiteNoiseBuffer(ac, 1);
    this.whiteNoise.loop = true;
    this.whiteNoise.start();
    this.noiseInput = this.ac.createGain();
    this.noiseInput.gain.value = 0;
    this.whiteNoise.connect(this.noiseInput);
    this.noiseInput.connect(this.output);

    this.osc = this.ac.createOscillator();
    this.osc.type = "triangle";
    this.osc.frequency.value = this.frequency;

    this.waveShaper = this.ac.createWaveShaper();
    this.waveShaper.curve = makeDistortionCurve(2);
    this.waveShaper.oversample = "2x";

    this.saturationNode = this.ac.createGain();
    this.saturationNode.gain.value = this.saturation;
    this.osc.connect(this.saturationNode);
    this.saturationNode.connect(this.waveShaper);
    this.waveShaper.connect(this.input);

    this.osc.start();
  }

  get out() {
    return this.filter;
  }

  trigger(time = this.ac.currentTime, accent = false) {
    this.osc.frequency.cancelScheduledValues(time);
    this.osc.frequency.setValueAtTime(
      this.frequency * this.env_amount,
      time
    );
    this.osc.frequency.exponentialRampToValueAtTime(
      this.frequency,
      time + this.env_duration / 1000.0
    );

    this.noiseInput.gain.cancelScheduledValues(time);
    this.noiseInput.gain.setValueAtTime(this.tone, time);
    this.noiseInput.gain.exponentialRampToValueAtTime(
      0.00001,
      time + this.tone_decay / 1000.0
    );

    this.output.gain.setValueAtTime(
      this.volume * (accent ? 2.0 : 1.0),
      time
    );
    this.saturationNode.gain.setValueAtTime(this.saturation, time);
    this.input.gain.cancelScheduledValues(time);
    this.input.gain.linearRampToValueAtTime(this.volume, time + 0.005);
    this.input.gain.exponentialRampToValueAtTime(
      0.00001,
      time + this.decay / 1000.0
    );
  }
}

class SnareDrum909 {
  frequency = 220;
  decay = 250;
  tone = 0.25;
  tone_decay = 250;
  volume = 0.5;
  env_amount = 4.0;
  env_duration = 10;
  filter_type = "notch";
  filter_freq = 1000;

  constructor(ac) {
    this.ac = ac;
    this.output = this.ac.createGain();
    this.output.gain.value = 0;

    this.filter = new BiquadFilterNode(this.ac, {
      type: this.filter_type,
      frequency: this.filter_freq,
    });

    this.output.connect(this.filter);
    this.input = this.ac.createGain();
    this.input.gain.value = 0;
    this.input.connect(this.output);

    this.whiteNoise = this.ac.createBufferSource();
    this.whiteNoise.buffer = getWhiteNoiseBuffer(ac, 1);
    this.whiteNoise.loop = true;
    this.whiteNoise.start();
    this.noiseInput = this.ac.createGain();
    this.noiseInput.gain.value = 0;
    this.whiteNoise.connect(this.noiseInput);
    this.noiseInput.connect(this.output);

    this.osc = this.ac.createOscillator();
    this.osc.type = "triangle";
    this.osc.frequency.value = this.frequency;

    this.osc.connect(this.input);
    this.osc.start();
  }

  get out() {
    return this.filter;
  }

  trigger(time = this.ac.currentTime, accent = false) {
    this.osc.frequency.cancelScheduledValues(time);
    this.osc.frequency.setValueAtTime(
      this.frequency * this.env_amount,
      time
    );
    this.osc.frequency.exponentialRampToValueAtTime(
      this.frequency,
      time + this.env_duration / 1000.0
    );

    this.noiseInput.gain.cancelScheduledValues(time);
    this.noiseInput.gain.setValueAtTime(this.tone, time);
    this.noiseInput.gain.exponentialRampToValueAtTime(
      0.00001,
      time + this.tone_decay / 1000.0
    );

    this.output.gain.setValueAtTime(
      this.volume * (accent ? 2.0 : 1.0),
      time
    );
    this.input.gain.cancelScheduledValues(time);
    this.input.gain.linearRampToValueAtTime(this.volume, time + 0.005);
    this.input.gain.exponentialRampToValueAtTime(
      0.00001,
      time + this.decay / 1000.0
    );
  }
}

class RimShot909 {
  decay = 30;
  filterTypes = ["bandpass", "bandpass", "bandpass"];
  filterFreqs = [220, 500, 950];
  filterQs = [10.5, 10.5, 10.5];
  filterGains = [10, 20, 30];
  hiPassFreq = 100;
  filterNodes = [];
  volume = 0.6;
  saturation = 3.0;

  rimNoise = [
    -0.0938141867518425, 0.7102846503257751, -0.685766339302063,
    0.4907262921333313, -0.3911896049976349, -0.3124760091304779,
    0.6563512682914734, 0.928503155708313, -0.6719098091125488,
    0.946106493473053, 0.702319860458374, 0.3403726816177368,
    -0.7190880179405212, 0.2917483150959015, -0.7644904851913452,
    0.9628100991249084, 0.4206474721431732, -0.44558143615722656,
    -0.9672186374664307, 0.6598025560379028, 0.47643211483955383,
    0.5561770796775818, 0.3712882697582245, -0.36183351278305054,
    -0.7939896583557129, 0.39301514625549316, -0.9791231751441956,
    -0.7119218111038208, 0.17154400050640106, 0.49292445182800293,
    -0.044391319155693054, -0.5022702217102051, 0.42775845527648926,
    -0.7908858060836792, 0.15842849016189575, -0.3464527428150177,
    -0.06815345585346222, -0.6528737545013428, -0.8457662463188171,
    0.2706998884677887, -0.4698350429534912, 0.6159835457801819,
    0.579700767993927, -0.08275951445102692, -0.5312353372573853,
    0.6295946836471558, -0.7151079773902893, -0.4602707028388977,
    0.3251723647117615, 0.5111592411994934, 0.8249071836471558,
    0.33816373348236084, 0.16297145187854767, 0.20368638634681702,
    -0.6493934988975525, -0.7581902146339417, 0.7735790610313416,
    0.47196561098098755, -0.10748262703418732, 0.7939162850379944,
    0.1509392261505127, 0.5842358469963074, -0.05638119578361511,
    0.8583419919013977, 0.6294043660163879, 0.22440209984779358,
    -0.8036736845970154, 0.4246376156806946, 0.6533545255661011,
    -0.6216084361076355, 0.1065131276845932, 0.7721655964851379,
    -0.8856338262557983, -0.9257946014404297, -0.22200027108192444,
    0.000844220572616905, 0.099571093916893, 0.6854760050773621,
    -0.7621583342552185, -0.38532841205596924, -0.6560276746749878,
    -0.11282013356685638, 0.3745887279510498, -0.8450918793678284,
    -0.6507189869880676, 0.7628042101860046, -0.28953537344932556,
    -0.3797481060028076, 0.8847131729125977, 0.7058473825454712,
    0.47311416268348694, -0.10166404396295547, 0.6752808094024658,
    0.8873506188392639, 0.6834714412689209, 0.8259801268577576,
    0.7404413223266602, 0.6065666675567627, 0.48070207238197327,
    0.3736712634563446, -0.253595769405365, -0.9127187728881836,
    0.8663365244865417, 0.882439374923706, -0.09889926016330719,
    0.9645036458969116, -0.8030155897140503, 0.7513594627380371,
    -0.19000419974327087, 0.6537664532661438, 0.9187515377998352,
    0.6098461151123047, -0.800383985042572, 0.5615882873535156,
    -0.07559498399496078, 0.14509990811347961, 0.6961334347724915,
    -0.32785388827323914, 0.36420372128486633, -0.057758450508117676,
    0.48798951506614685, -0.031131094321608543, -0.08771521598100662,
    -0.8598763942718506, 0.4171707332134247, 0.1086604967713356,
    0.03149956092238426, 0.641241729259491, -0.6776508092880249,
    0.8478045463562012, 0.515723705291748, -0.3923241198062897,
    -0.9096614122390747, 0.07917828857898712, -0.2778809368610382,
    -0.8534830212593079, -0.0927843526005745, -0.1977241039276123,
    0.16568148136138916, -0.9512038230895996, 0.03670766204595566,
    0.9108136892318726, 0.1477319896221161, 0.30539363622665405,
    -0.7050888538360596, 0.9099668264389038, -0.49326977133750916,
    0.6052023768424988, 0.004538396373391151, -0.7342783212661743,
    0.047306571155786514, 0.3396494388580322, -0.24110381305217743,
    -0.6909115314483643, -0.15850205719470978, 0.6355003118515015,
    0.1780438870191574, 0.7516891360282898, -0.7339579463005066,
    0.7635491490364075, -0.08038980513811111, 0.7032962441444397,
    -0.270632266998291, -0.47390109300613403, 0.6037904620170593,
    0.07386089116334915, 0.19045040011405945, 0.24417270720005035,
    -0.6874961256980896, -0.1794464886188507, 0.5320767164230347,
    -0.0663330927491188, -0.06958585232496262, -0.9505257606506348,
    0.8732248544692993, -0.9755458831787109, -0.9906177520751953,
    -0.7038559317588806, -0.8764607310295105, -0.5446853637695312,
    -0.25804081559181213, -0.846868634223938, -0.19499368965625763,
    -0.593953549861908, 0.9608613848686218, -0.20571835339069366,
    -0.7908936738967896, -0.6336819529533386, -0.3839634656906128,
    0.9093872308731079, 0.8396366238594055, -0.7636103630065918,
    0.6916990876197815, 0.315847247838974, 0.8680893182754517,
    0.12821145355701447, 0.30398818850517273, 0.9621102213859558,
    0.9373974204063416, -0.71066778898239,
  ];

  constructor(ac) {
    this.ac = ac;

    this.output = this.ac.createGain();
    this.output.gain.value = 0;

    this.hiPass = new BiquadFilterNode(this.ac, {
      frequency: this.hiPassFreq,
      type: "highpass",
    });
    this.hiPass.connect(this.output);

    this.saturationNode = this.ac.createGain();
    this.saturationNode.gain.value = this.saturation || 1.0;

    this.waveShaper = this.ac.createWaveShaper();
    this.waveShaper.curve = makeDistortionCurve(20);
    this.waveShaper.oversample = "2x";
    this.saturationNode.connect(this.waveShaper);
    this.waveShaper.connect(this.hiPass);

    this.noiseInput = this.ac.createGain();
    this.noiseInput.gain.value = 0;

    this.buffer = this.ac.createBuffer(1, 256, this.ac.sampleRate);
    const nowBuffering = this.buffer.getChannelData(0);
    for (let i = 0; i < 200; i++) {
      nowBuffering[i] = this.rimNoise[i];
    }

    for (let x = 0; x < this.filterFreqs.length; x++) {
      this.filterNodes[x] = new BiquadFilterNode(this.ac, {
        frequency: this.filterFreqs[x],
        Q: this.filterQs[x],
        type: this.filterTypes[x],
      });
      this.filterNodes[x].connect(this.saturationNode);
      if (x === 0) {
        this.noiseInput.connect(this.filterNodes[x]);
      }
      this.filterNodes[x].gain.value = this.filterGains[x];
    }
  }

  get out() {
    return this.output;
  }

  trigger(time = this.ac.currentTime, accent = false) {
    // Apply the latest parameter values before each hit so external controls can shape the timbre.
    const freqs = this.filterFreqs || [];
    const qs = this.filterQs || [];
    const gains = this.filterGains || [];
    this.filterNodes.forEach((node, idx) => {
      const f = freqs[idx];
      const q = qs[idx];
      const g = gains[idx];
      if (typeof f === "number") {
        node.frequency.setValueAtTime(clamp(f, 80, 8000), time);
      }
      if (typeof q === "number") {
        node.Q.setValueAtTime(clamp(q, 0.5, 25), time);
      }
      if (typeof g === "number") {
        node.gain.setValueAtTime(clamp(g, -20, 40), time);
      }
    });
    if (this.hiPass) {
      this.hiPass.frequency.setValueAtTime(
        clamp(this.hiPassFreq || 80, 50, 6000),
        time
      );
    }
    if (this.saturationNode) {
      this.saturationNode.gain.setValueAtTime(
        clamp(this.saturation || 1.0, 0.1, 10.0),
        time
      );
    }

    if (this.bufferSource) this.bufferSource.stop();
    this.bufferSource = this.ac.createBufferSource();
    this.bufferSource.buffer = this.buffer;
    this.bufferSource.connect(this.noiseInput);
    this.bufferSource.start(time);
    this.noiseInput.gain.setValueAtTime(1.0, time);
    this.noiseInput.gain.exponentialRampToValueAtTime(
      0.00001,
      time + this.decay / 1000.0
    );

    this.output.gain.setValueAtTime(
      this.volume * (accent ? 2.0 : 1.0),
      time
    );
  }
}

class Clap909 {
  decay = 80;
  spread = 10;
  filterTypes = ["highpass", "bandpass"];
  filterFreqs = [900, 1200];
  filterQs = [1.2, 0.7];
  filterGains = [0, 0, 5];
  filterTopology = "serial";
  highPassFreq = 80;
  filterNodes = [];
  volume = 1.0;
  tune = 1000;
  tone = 2200;
  tail = 250;

  constructor(ac) {
    this.ac = ac;
    this.output = this.ac.createGain();
    this.output.gain.value = 0;

    this.hiPass = new BiquadFilterNode(this.ac, {
      frequency: this.hiPassFreq,
      type: "highpass",
    });
    this.hiPass.connect(this.output);

    this.saturationNode = this.ac.createGain();
    this.saturationNode.gain.value = this.saturation || 1.0;
    this.saturationNode.connect(this.hiPass);

    this.noiseInput = this.ac.createGain();
    this.noiseInput.gain.value = 0;

    this.delayInput = this.ac.createGain();
    this.delayOutput = this.ac.createGain();
    this.modulatorLevel = this.ac.createGain();
    this.modulatorLevel.gain.value = 0.4;
    this.delayInput.gain.value = 1.0;
    this.delayOutput.gain.value = 0;
    this.delayInput.connect(this.delayOutput);

    this.modulator = this.ac.createOscillator();
    this.modulator.frequency.value = 40;
    this.modulator.type = "sawtooth";
    this.modulator.connect(this.modulatorLevel);
    this.modulatorLevel.connect(this.delayInput.gain);
    this.modulator.start();

    this.toneFilter = new BiquadFilterNode(this.ac, {
      frequency: this.tone,
      Q: 2.0,
      type: "bandpass",
    });

    this.whiteNoise = this.ac.createBufferSource();
    this.whiteNoise.buffer = getWhiteNoiseBuffer(this.ac, 1);
    this.whiteNoise.loop = true;
    this.whiteNoise.start();

    this.whiteNoise.connect(this.toneFilter);
    this.toneFilter.connect(this.noiseInput);

    this.noiseInput.connect(this.saturationNode);

    this.whiteNoise.connect(this.delayInput);

    for (let x = 0; x < this.filterFreqs.length; x++) {
      this.filterNodes[x] = new BiquadFilterNode(this.ac, {
        frequency: this.filterFreqs[x],
        Q: this.filterQs[x],
        type: this.filterTypes[x],
      });
      if (x === 0) {
        this.delayOutput.connect(this.filterNodes[0]);
      } else {
        this.filterNodes[x - 1].connect(this.filterNodes[x]);
      }
      if (x === this.filterFreqs.length - 1) {
        this.filterNodes[x].connect(this.saturationNode);
      }
      this.filterNodes[x].gain.value = this.filterGains[x];
    }
  }

  get out() {
    return this.output;
  }

  trigger(t = this.ac.currentTime, accent = false) {
    const noiseGain = this.noiseInput.gain;
    const tail = this.tail / 1000.0;
    noiseGain.setValueAtTime(0.5, t);
    noiseGain.exponentialRampToValueAtTime(0.001, t + tail);

    const dc = this.spread / 1000.0;
    const decay = (this.decay / 250) * dc;
    const z = 0.000001;
    const delayGain = this.delayOutput.gain;
    delayGain.cancelScheduledValues(1.0);

    delayGain.setValueAtTime(0.1, t);
    delayGain.setTargetAtTime(z, t, dc / 3 + decay);

    delayGain.setValueAtTime(0.8, t + dc);
    delayGain.setTargetAtTime(z, t + dc, dc / 2 + decay);

    delayGain.setValueAtTime(0.5, t + dc * 2);
    delayGain.setTargetAtTime(z, t + dc * 2, dc / 2 + decay);

    delayGain.setValueAtTime(0.3, t + dc * 3);
    delayGain.setTargetAtTime(z, t + dc * 3, dc / 2 + decay);

    delayGain.setValueAtTime(0.2, t + dc * 4);
    delayGain.setTargetAtTime(z, t + dc * 4, dc / 2 + this.decay / 2500);

    const vol = this.volume * (accent ? 2.0 : 1.0);
    this.output.gain.setValueAtTime(vol, t);
  }
}

class HiHat909 {
  volume = 0.5;
  decay = 150;
  tone = 10000;

  constructor(ac) {
    this.ac = ac;
    this.output = this.ac.createGain();
    this.output.gain.value = 0;

    this.noiseSource = this.ac.createBufferSource();
    this.noiseSource.buffer = getWhiteNoiseBuffer(this.ac, 1);
    this.noiseSource.loop = true;
    this.noiseSource.start();

    this.bpf = new BiquadFilterNode(this.ac, {
      type: "bandpass",
      frequency: this.tone,
      Q: 0.8,
    });
    this.hpf = new BiquadFilterNode(this.ac, {
      type: "highpass",
      frequency: 7000,
      Q: 0.7,
    });

    this.env = this.ac.createGain();
    this.env.gain.value = 0;

    this.noiseSource.connect(this.bpf);
    this.bpf.connect(this.hpf);
    this.hpf.connect(this.env);
    this.env.connect(this.output);
  }

  get out() {
    return this.output;
  }

  trigger(time = this.ac.currentTime, accent = false) {
    this.bpf.frequency.setValueAtTime(this.tone, time);
    this.output.gain.setValueAtTime(this.volume * (accent ? 1.5 : 1), time);

    this.env.gain.cancelScheduledValues(time);
    this.env.gain.setValueAtTime(0.9, time);
    this.env.gain.exponentialRampToValueAtTime(
      0.00001,
      time + this.decay / 1000
    );
  }
}

class Cowbell808 {
  volume = 0.7;
  decay = 400;
  freq1 = 587;
  freq2 = 845;
  centerFreq = 2640;
  resonance = 1;

  constructor(ac) {
    this.ac = ac;
    this.output = this.ac.createGain();
    this.output.gain.value = 0;

    this.bandpass = new BiquadFilterNode(this.ac, {
      type: "bandpass",
      frequency: this.centerFreq,
      Q: this.resonance,
    });

    this.env = this.ac.createGain();
    this.env.gain.value = 0;
    this.env.connect(this.bandpass);
    this.bandpass.connect(this.output);

    this.osc1 = this.ac.createOscillator();
    this.osc1.type = "triangle";
    this.osc1.frequency.value = this.freq1;
    this.osc2 = this.ac.createOscillator();
    this.osc2.type = "triangle";
    this.osc2.frequency.value = this.freq2;

    this.osc1.connect(this.env);
    this.osc2.connect(this.env);
    this.osc1.start();
    this.osc2.start();

    this.noiseBuffer = getWhiteNoiseBuffer(this.ac, 0.2);
  }

  get out() {
    return this.output;
  }

  trigger(time = this.ac.currentTime, accent = false) {
    const impact = this.volume * (accent ? 1.2 : 1);
    const tail = impact * 0.6;
    this.output.gain.setValueAtTime(1, time);
    this.env.gain.cancelScheduledValues(time);
    this.env.gain.setValueAtTime(impact, time);
    this.env.gain.exponentialRampToValueAtTime(tail, time + 0.03);
    this.env.gain.exponentialRampToValueAtTime(
      0.0001,
      time + this.decay / 1000
    );

    // Refresh slight noise burst for realism
    const noise = this.ac.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const noiseGain = this.ac.createGain();
    noiseGain.gain.value = 0.1 * impact;
    noise.connect(noiseGain);
    noiseGain.connect(this.env);
    noise.start(time);
    noise.stop(time + this.decay / 1000);

    this.osc1.frequency.setValueAtTime(this.freq1, time);
    this.osc2.frequency.setValueAtTime(this.freq2, time);
    this.bandpass.frequency.setValueAtTime(this.centerFreq, time);
    this.bandpass.Q.setValueAtTime(this.resonance, time);
  }
}

export const createDrumEngine = () => {
  const ac = new AudioContext();
  const master = ac.createGain();
  master.gain.value = 0.9;
  master.connect(ac.destination);
  let closed = false;

  const kick = new BassDrum909(ac);
  const snare = new SnareDrum909(ac);
  const clap = new Clap909(ac);
  const rim = new RimShot909(ac);
  const hat = new HiHat909(ac);
  const cowbell = new Cowbell808(ac);

  [kick, snare, clap, rim, hat, cowbell].forEach(v => v.out.connect(master));

  const resume = () => ac.resume();
  const safeResume = () => {
    if (closed || ac.state === "closed") return;
    resume();
  };
  document.addEventListener("click", safeResume, { once: true });
  document.addEventListener("keydown", safeResume, { once: true });

  return {
    triggerSound(soundId, params = {}, time = ac.currentTime) {
      if (closed || ac.state === "closed") return;
      const voices = { kick, snare, clap, rim, hat, cowbell };
      const voice = voices[soundId];
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
      document.removeEventListener("click", safeResume);
      document.removeEventListener("keydown", safeResume);
      ac.close();
    }
  };
};
