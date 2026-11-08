/**
 * SeasonQR - Procedural Web Audio Ambient Soundscape
 * 
 * Generates peaceful, soothing procedural nature soundscapes and magical
 * morph interaction chimes using the native Web Audio API.
 * - 100% Client-side
 * - Zero external mp3/wav audio files (0 KB network overhead)
 * - Calming pentatonic wind chimes, soft ambient breeze, and morph sparkle!
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private ambientGain: GainNode | null = null;
  private windTimer: number | null = null;
  private chimeTimer: number | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean, season: string = 'summer') {
    this.isMuted = muted;
    this.initContext();

    if (this.isMuted) {
      this.stopAmbient();
    } else {
      this.startAmbient(season);
    }
  }

  public playMorphSound(toQR: boolean) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Pleasant arpeggio chords
    const notes = toQR ? [523.25, 659.25, 783.99, 1046.5] : [1046.5, 783.99, 659.25, 523.25];

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  }

  private startAmbient(season: string) {
    if (!this.ctx) return;
    this.stopAmbient();

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    this.ambientGain.connect(this.ctx.destination);

    // Subtle gentle bell chime periodically
    const pentatonicNotes = season === 'spring'
      ? [523.25, 587.33, 659.25, 783.99, 880.0] // C major pentatonic
      : season === 'autumn'
      ? [440.0, 523.25, 587.33, 659.25, 783.99] // A minor pentatonic
      : season === 'winter'
      ? [587.33, 659.25, 783.99, 880.0, 1046.5] // High crystal
      : [392.0, 440.0, 523.25, 587.33, 659.25]; // Warm summer G

    const triggerChime = () => {
      if (this.isMuted || !this.ctx || !this.ambientGain) return;
      const freq = pentatonicNotes[Math.floor(Math.random() * pentatonicNotes.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + 2.2);

      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.3);

      const nextDelay = 4000 + Math.random() * 6000;
      this.chimeTimer = window.setTimeout(triggerChime, nextDelay);
    };

    triggerChime();
  }

  private stopAmbient() {
    if (this.chimeTimer) {
      window.clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
    if (this.windTimer) {
      window.clearTimeout(this.windTimer);
      this.windTimer = null;
    }
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }
  }
}

export const soundEngine = new SoundEngine();
