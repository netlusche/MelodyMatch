class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private isUnlocked = false;
  private listenersRegistered = false;
  private handler = () => this.unlock();

  getAudio(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.loop = true;
    }
    return this.audio;
  }

  unlock() {
    if (this.isUnlocked) return;
    const audio = this.getAudio();
    
    // If we don't have a real URL set yet, warm it up with a 1-byte silent WAV
    const hasRealSrc = audio.src && !audio.src.startsWith('data:');
    if (!hasRealSrc) {
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA';
    }
    
    audio.play()
      .then(() => {
        audio.pause();
        this.isUnlocked = true;
        console.log("Audio unlocked successfully via user gesture");
        this.removeListeners();
      })
      .catch((err) => {
        console.warn("Failed to unlock audio:", err);
      });
  }

  registerUnlockListeners() {
    if (this.listenersRegistered || this.isUnlocked) return;
    window.addEventListener('click', this.handler);
    window.addEventListener('touchend', this.handler);
    this.listenersRegistered = true;
  }

  private removeListeners() {
    if (!this.listenersRegistered) return;
    window.removeEventListener('click', this.handler);
    window.removeEventListener('touchend', this.handler);
    this.listenersRegistered = false;
  }

  playSong(previewUrl: string): Promise<void> {
    const audio = this.getAudio();
    if (audio.src !== previewUrl) {
      audio.src = previewUrl;
    }
    return audio.play().catch(err => {
      console.warn("Playback failed. Re-registering unlock listeners:", err);
      this.isUnlocked = false;
      this.registerUnlockListeners();
      throw err;
    });
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
  }
}

export const audioManager = new AudioManager();
