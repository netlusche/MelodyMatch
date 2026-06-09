class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private isUnlocked = false;
  private listenersRegistered = false;
  private handler = () => this.unlock();

  constructor() {
    if (typeof window !== 'undefined') {
      this.registerUnlockListeners();
    }
  }

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
    
    // Check if we already have a real song source set (e.g. from playSong in same gesture)
    const hasRealSrc = audio.src && !audio.src.startsWith('data:');
    if (hasRealSrc) {
      audio.play()
        .then(() => {
          this.isUnlocked = true;
          console.log("Audio unlocked successfully via real track play gesture");
          this.removeListeners();
        })
        .catch((err) => {
          console.warn("Failed to unlock audio with real track:", err);
        });
      return;
    }
    
    const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA';
    audio.src = silentWav;
    
    audio.play()
      .then(() => {
        // Only pause if the source is still the silent WAV.
        // If it was changed to a real song in the meantime, do not pause it.
        if (audio.src && audio.src.startsWith('data:')) {
          audio.pause();
        }
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

  playSong(previewUrl: string, loop = true): Promise<void> {
    const audio = this.getAudio();
    audio.loop = loop;
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
