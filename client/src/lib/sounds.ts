// Utility function to create and play sounds using Web Audio API
class SoundEffect {
  private audioContext: AudioContext | null = null;
  
  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  playCoinSound() {
    const context = this.initAudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      400,
      context.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      context.currentTime + 0.2
    );

    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
  }

  playXPSound() {
    const context = this.initAudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(600, context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(
      900,
      context.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(0.2, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      context.currentTime + 0.15
    );

    oscillator.start();
    oscillator.stop(context.currentTime + 0.15);
  }
}

export const soundEffect = new SoundEffect();
