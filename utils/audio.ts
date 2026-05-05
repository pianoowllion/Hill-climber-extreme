
export class SoundManager {
    private static audioContext: AudioContext | null = null;
    private static masterGain: GainNode | null = null;
    private static musicGain: GainNode | null = null;
    private static analyser: AnalyserNode | null = null;
    private static dataArray: Uint8Array | null = null;
    private static bufferCache: Map<string, AudioBuffer> = new Map();
    
    // Music State
    private static musicBuffer: AudioBuffer | null = null;
    private static musicSource: AudioBufferSourceNode | null = null;
    private static musicDuration: number = 0;
    private static isRenderingMusic: boolean = false;
    private static isPlayingMusic: boolean = false;

    // Coin SFX State
    private coinStep: number = 0;
    private lastCoinTime: number = 0;
  
    // Continuous Sound Nodes (Instance based for specific car context)
    private engineOsc: OscillatorNode | null = null;
    private engineGain: GainNode | null = null;
    
    private windSource: AudioBufferSourceNode | null = null;
    private windGain: GainNode | null = null;

    private tireSource: AudioBufferSourceNode | null = null;
    private tireGain: GainNode | null = null;
    
    private isInitialized: boolean = false;

    constructor() {
      // Lazy init called on first interaction usually
      if (typeof window !== 'undefined' && !SoundManager.audioContext) {
          SoundManager.init();
      }
      if (SoundManager.audioContext && !this.isInitialized) {
          this.setupContinuousSounds();
          this.isInitialized = true;
      }
    }
    
    public static init() {
        if (typeof window === 'undefined') return;

        if (!SoundManager.audioContext) {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            if (AudioContextClass) {
                const ctx = new AudioContextClass();
                SoundManager.audioContext = ctx;

                // 1. Master Gain
                const masterGain = ctx.createGain();
                masterGain.gain.value = 0.4; // Slightly increased master
                SoundManager.masterGain = masterGain;

                // 2. Music Gain (sub-master)
                const musicGain = ctx.createGain();
                musicGain.gain.value = 0.8; // Increased base music volume
                musicGain.connect(masterGain);
                SoundManager.musicGain = musicGain;

                // 3. Analyser
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256; 
                SoundManager.analyser = analyser;
                SoundManager.dataArray = new Uint8Array(analyser.frequencyBinCount);

                masterGain.connect(analyser);
                analyser.connect(ctx.destination);
                
                // Create Noise Buffers once
                SoundManager.createNoiseBuffer('white', ctx);
                SoundManager.createNoiseBuffer('brown', ctx);
                
                // Trigger Music Pre-render if not already done via preload
                if (!SoundManager.musicBuffer && !SoundManager.isRenderingMusic) {
                    SoundManager.renderMusicLoop();
                }
            }
        } else if (SoundManager.audioContext.state === 'suspended') {
            SoundManager.audioContext.resume();
        }
    }

    // New method to start rendering without needing the main audio context yet
    public static preload() {
        if (!SoundManager.musicBuffer && !SoundManager.isRenderingMusic) {
            SoundManager.renderMusicLoop();
        }
    }

    public static isMusicReady(): boolean {
        return !!SoundManager.musicBuffer;
    }

    private static createNoiseBuffer(type: 'white' | 'brown', ctx: AudioContext) {
        if (SoundManager.bufferCache.has(type)) return;

        const bufferSize = ctx.sampleRate * 2; // 2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            if (type === 'white') {
                data[i] = Math.random() * 2 - 1;
            } else {
                // Brown noise approximation
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5; // Compensate for gain loss
            }
        }
        SoundManager.bufferCache.set(type, buffer);
    }

    // --- MUSIC PRE-RENDERING ---

    private static async renderMusicLoop() {
        SoundManager.isRenderingMusic = true;
        
        const bpm = 105;
        const stepTime = (60 / bpm) / 2; // 8th notes
        const totalSteps = 128; // 16 bars
        
        const musicDuration = totalSteps * stepTime;
        SoundManager.musicDuration = musicDuration;

        const renderDuration = musicDuration + 2; // Render extra for tails

        // Use Offline Context
        const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
        // Standard sample rate 44100 is safe
        const ctx = new OfflineCtx(1, 44100 * renderDuration, 44100);
        
        // Temporary Master for offline rendering
        const master = ctx.createGain();
        master.gain.value = 0.8; // Increased render volume
        master.connect(ctx.destination);

        // Schedule the entire loop
        for (let i = 0; i < totalSteps; i++) {
            const time = i * stepTime;
            SoundManager.scheduleStep(i, time, ctx, master);
        }

        try {
            const renderedBuffer = await ctx.startRendering();
            SoundManager.musicBuffer = renderedBuffer;
            // Dispatch event for UI
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('music-ready'));
            }
            // If play was requested during render, start it now
            if (SoundManager.isPlayingMusic) {
                SoundManager.startBuffer();
            }
        } catch (e) {
            console.error("Failed to render music", e);
        }
        
        SoundManager.isRenderingMusic = false;
    }

    private static scheduleStep(globalStep: number, time: number, ctx: BaseAudioContext, dest: AudioNode) {
        // Sequence Logic (Intro -> Build -> Drop -> Outro)
        const isIntro = globalStep < 32;        
        const isBuild = globalStep >= 32 && globalStep < 64; 
        const isDrop = globalStep >= 64 && globalStep < 96;  
        const isOutro = globalStep >= 96;       

        const chordStep = globalStep % 32;
        
        // Chord Progression: Am - F - C - G
        let chordRoot = 220; // A3
        let chordType = 'minor'; 
        if (chordStep < 8) { chordRoot = 220; chordType = 'minor'; } 
        else if (chordStep < 16) { chordRoot = 174.61; chordType = 'major'; } 
        else if (chordStep < 24) { chordRoot = 261.63; chordType = 'major'; } 
        else { chordRoot = 196.00; chordType = 'major'; } 

        // --- DRUMS ---
        if (isBuild) {
            if (globalStep % 2 !== 0) SoundManager.playHiHat(ctx, dest, time);
            if (globalStep >= 56 && globalStep % 2 === 0) SoundManager.playSnare(ctx, dest, time);
        }
        if (isDrop || isOutro) {
            if (globalStep % 4 === 0) SoundManager.playKick(ctx, dest, time);
            if (globalStep % 4 === 2) SoundManager.playHiHat(ctx, dest, time);
            if (globalStep === 64) SoundManager.playCrash(ctx, dest, time);
        }

        // --- BASS ---
        if (isDrop) {
            if (globalStep % 2 !== 0) SoundManager.playNote(ctx, dest, chordRoot / 2, time, 0.2, 'sawtooth', 0.25);
        } else if (isOutro) {
             if (globalStep % 4 === 0) SoundManager.playNote(ctx, dest, chordRoot / 2, time, 0.3, 'sawtooth', 0.2);
        } else {
            // Atmospheric (Intro/Build)
            if (globalStep % 8 === 0) SoundManager.playNote(ctx, dest, chordRoot / 2, time, 0.8, 'triangle', 0.4); 
        }

        // --- MELODY / ARP ---
        const intervals = chordType === 'minor' ? [0, 3, 7, 12] : [0, 4, 7, 12];
        const patternIndices = [0, 1, 2, 3, 2, 1, 0, 2];
        const noteIndex = patternIndices[globalStep % 8];
        const freq = chordRoot * Math.pow(2, intervals[noteIndex]/12);
        
        if (isDrop) {
            const velocity = 0.15 + Math.random() * 0.05;
            SoundManager.playNote(ctx, dest, freq, time, 0.15, 'square', velocity);
        } else if (isBuild) {
            const velocity = 0.1 + (globalStep - 32) / 320; 
            SoundManager.playNote(ctx, dest, freq, time, 0.2, 'triangle', velocity);
        } else if (isIntro || isOutro) {
            SoundManager.playNote(ctx, dest, freq, time, 0.2, 'sine', 0.1);
        }

        // --- PADS ---
        if (!isDrop && globalStep % 8 === 0) {
            SoundManager.playPadNote(ctx, dest, chordRoot, time, 2.0);
            SoundManager.playPadNote(ctx, dest, chordRoot * Math.pow(2, intervals[1]/12), time, 2.0);
            if (isBuild) {
                 SoundManager.playPadNote(ctx, dest, chordRoot * Math.pow(2, (intervals[2]+3)/12), time, 2.0);
            }
        }
    }

    // --- INSTRUMENTS (Context Agnostic) ---

    private static playKick(ctx: BaseAudioContext, dest: AudioNode, time: number) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(time);
        osc.stop(time + 0.5);
    }

    private static playSnare(ctx: BaseAudioContext, dest: AudioNode, time: number) {
        // Create noise on the fly for offline context compatibility
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        source.start(time);
        source.stop(time + 0.25);
    }

    private static playHiHat(ctx: BaseAudioContext, dest: AudioNode, time: number) {
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        source.start(time);
        source.stop(time + 0.1);
    }

    private static playCrash(ctx: BaseAudioContext, dest: AudioNode, time: number) {
        const bufferSize = ctx.sampleRate * 2.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 1.5);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        source.start(time);
        source.stop(time + 2.0);
    }

    private static playNote(ctx: BaseAudioContext, dest: AudioNode, freq: number, time: number, duration: number, type: OscillatorType, vol: number) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(time);
        osc.stop(time + duration + 0.1);
    }

    private static playPadNote(ctx: BaseAudioContext, dest: AudioNode, freq: number, time: number, duration: number) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, time);
        filter.frequency.linearRampToValueAtTime(800, time + duration/2);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.05, time + 0.5); 
        gain.gain.linearRampToValueAtTime(0, time + duration); 
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        osc.start(time);
        osc.stop(time + duration);
    }

    // --- PUBLIC MUSIC CONTROLS ---

    public static startMusic() {
        if (SoundManager.isPlayingMusic) return; // already marked as playing
        SoundManager.isPlayingMusic = true;

        if (SoundManager.musicBuffer) {
            SoundManager.startBuffer();
        } else if (!SoundManager.isRenderingMusic) {
            SoundManager.renderMusicLoop();
        }
    }

    private static startBuffer() {
        if (!SoundManager.audioContext || !SoundManager.musicBuffer || !SoundManager.musicGain) return;
        
        // Stop previous if exists
        if (SoundManager.musicSource) {
            try { SoundManager.musicSource.stop(); } catch(e){}
        }

        const source = SoundManager.audioContext.createBufferSource();
        source.buffer = SoundManager.musicBuffer;
        source.loop = true;
        // Loop exactly at the musical duration, ignoring the reverb tail in the buffer for the next loop start
        // The reverb tail will naturally cut, but this ensures the beat is seamless.
        source.loopStart = 0;
        source.loopEnd = SoundManager.musicDuration;
        
        source.connect(SoundManager.musicGain);
        source.start(0);
        SoundManager.musicSource = source;
    }

    public static stopMusic() {
        SoundManager.isPlayingMusic = false;
        if (SoundManager.musicSource) {
            try {
                SoundManager.musicSource.stop();
                SoundManager.musicSource.disconnect();
            } catch(e) {}
            SoundManager.musicSource = null;
        }
    }

    public static setMusicVolume(volume: number) {
        if (SoundManager.musicGain && SoundManager.audioContext) {
            const t = SoundManager.audioContext.currentTime;
            SoundManager.musicGain.gain.setTargetAtTime(volume, t, 0.5);
        }
    }

    public toggleMusic() {
        if (SoundManager.isPlayingMusic) SoundManager.stopMusic();
        else SoundManager.startMusic();
        return SoundManager.isPlayingMusic;
    }

    // --- CONTINUOUS SOUNDS (Instance Methods) ---

    private setupContinuousSounds() {
        const ctx = SoundManager.audioContext;
        const master = SoundManager.masterGain;
        if (!ctx || !master) return;

        // --- ENGINE ---
        this.engineOsc = ctx.createOscillator();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 60;
        const engineFilter = ctx.createBiquadFilter();
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = 400;
        this.engineGain = ctx.createGain();
        this.engineGain.gain.value = 0;
        this.engineOsc.connect(engineFilter);
        engineFilter.connect(this.engineGain);
        this.engineGain.connect(master);
        this.engineOsc.start();

        // --- WIND (In Air) ---
        const whiteBuffer = SoundManager.bufferCache.get('white');
        if (whiteBuffer) {
            this.windSource = ctx.createBufferSource();
            this.windSource.buffer = whiteBuffer;
            this.windSource.loop = true;
            const windFilter = ctx.createBiquadFilter();
            windFilter.type = 'bandpass';
            windFilter.frequency.value = 800;
            this.windGain = ctx.createGain();
            this.windGain.gain.value = 0;
            this.windSource.connect(windFilter);
            windFilter.connect(this.windGain);
            this.windGain.connect(master);
            this.windSource.start();
        }

        // --- TIRES (On Ground) ---
        const brownBuffer = SoundManager.bufferCache.get('brown');
        if (brownBuffer) {
            this.tireSource = ctx.createBufferSource();
            this.tireSource.buffer = brownBuffer;
            this.tireSource.loop = true;
            this.tireGain = ctx.createGain();
            this.tireGain.gain.value = 0;
            this.tireSource.connect(this.tireGain);
            this.tireGain.connect(master);
            this.tireSource.start();
        }
    }
  
    public resume() {
      const ctx = SoundManager.audioContext;
      if (!ctx) {
          SoundManager.init();
          return;
      }
      if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
        ctx.resume();
      }
      if (!this.isInitialized) {
          this.setupContinuousSounds();
          this.isInitialized = true;
      }
      if (!SoundManager.isPlayingMusic) {
          SoundManager.startMusic();
      }
    }

    public updateContinuous(speedRatio: number, isGrounded: boolean, isGasPressed: boolean) {
        const ctx = SoundManager.audioContext;
        if (!ctx || !this.isInitialized) return;
        const t = ctx.currentTime;
        const speed = Math.max(0, Math.min(1, Math.abs(speedRatio)));

        if (this.engineOsc && this.engineGain) {
            const targetFreq = 80 + (speed * 220) + (isGasPressed ? 50 : 0);
            this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.1);
            const targetGain = 0.01 + (speed * 0.03) + (isGasPressed ? 0.02 : 0);
            this.engineGain.gain.setTargetAtTime(targetGain, t, 0.1);
        }

        if (this.tireGain) {
            const tireVol = isGrounded && speed > 0.1 ? Math.min(0.05, speed * 0.05) : 0;
            this.tireGain.gain.setTargetAtTime(tireVol, t, 0.1);
        }

        if (this.windGain) {
            let windVol = speed * 0.015; 
            if (!isGrounded) windVol += 0.01; 
            if (speed < 0.1) windVol = 0;
            this.windGain.gain.setTargetAtTime(windVol, t, 0.2);
        }
    }

    public stopContinuous() {
        const ctx = SoundManager.audioContext;
        if (!ctx || !this.isInitialized) return;
        const t = ctx.currentTime;

        if (this.engineGain) {
            this.engineGain.gain.cancelScheduledValues(t);
            this.engineGain.gain.setValueAtTime(0, t);
            this.engineGain.disconnect();
        }
        if (this.windGain) {
            this.windGain.gain.cancelScheduledValues(t);
            this.windGain.gain.setValueAtTime(0, t);
            this.windGain.disconnect();
        }
        if (this.tireGain) {
            this.tireGain.gain.cancelScheduledValues(t);
            this.tireGain.gain.setValueAtTime(0, t);
            this.tireGain.disconnect();
        }
        
        if (this.engineOsc) { try { this.engineOsc.stop(); this.engineOsc.disconnect(); } catch(e){} }
        if (this.windSource) { try { this.windSource.stop(); this.windSource.disconnect(); } catch(e){} }
        if (this.tireSource) { try { this.tireSource.stop(); this.tireSource.disconnect(); } catch(e){} }
        
        this.engineOsc = null;
        this.windSource = null;
        this.tireSource = null;
        this.engineGain = null;
        this.windGain = null;
        this.tireGain = null;
        
        this.isInitialized = false;
    }
  
    public playCoinSound() {
      if (!SoundManager.audioContext) SoundManager.init();
      const ctx = SoundManager.audioContext;
      const master = SoundManager.masterGain;
      if (!ctx || !master) return;
  
      const now = Date.now();
      if (now - this.lastCoinTime > 2000) {
        this.coinStep = 0;
      }
      this.lastCoinTime = now;
  
      const scale = [2093.00, 2349.32, 2637.02, 2793.83, 3135.96, 3520.00, 3951.07, 4186.01]; 
      const frequency = scale[this.coinStep % scale.length];
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
  
      osc.type = 'sine'; 
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02); 
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
      osc.connect(gain);
      gain.connect(master);
  
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
  
      this.coinStep++;
    }
}
