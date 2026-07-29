import { _decorator, Component, AudioSource, AudioClip, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SoundManager')
export class SoundManager extends Component {

    private static _instance: SoundManager | null = null;

    public static get instance(): SoundManager | null {
        return this._instance;
    }

    @property({ type: [AudioSource] })
    public audioSources: AudioSource[] = [];

    @property({ type: [AudioClip] })
    public soundClips: AudioClip[] = [];

    // Dedicated looping source so we can stop it cleanly
    private _loopSource: AudioSource | null = null;

    onLoad() {
        if (SoundManager._instance && SoundManager._instance !== this) {
            this.destroy();
            return;
        }
        SoundManager._instance = this;

        if (this.audioSources.length === 0) {
            const src = this.getComponent(AudioSource);
            if (src) {
                this.audioSources.push(src);
            } else {
                const newSrc = this.node.addComponent(AudioSource);
                this.audioSources.push(newSrc);
            }
        }
    }

    // ── Get free AudioSource ──────────────────────────────────────────
    private getAvailableSource(): AudioSource {
        for (let src of this.audioSources) {
            if (!src.playing) return src;
        }
        const tempNode = new Node('TempAudio');
        const newSource = tempNode.addComponent(AudioSource);
        tempNode.parent = this.node;
        this.audioSources.push(newSource);
        return newSource;
    }

    // ── One-shot ──────────────────────────────────────────────────────
    public playOneShot(index: number, volume: number = 1) {
        if (!this.soundClips.length) {
            console.warn('SoundManager: No sound clips assigned.');
            return;
        }
        if (index < 0 || index >= this.soundClips.length) {
            console.warn(`SoundManager: Invalid sound index ${index}`);
            return;
        }
        const clip = this.soundClips[index];
        const src = this.getAvailableSource();
        src.playOneShot(clip, volume);
    }

    public playLoop(index: number, source: AudioSource) {
        if (!this.soundClips[index]) return;
        source.clip = this.soundClips[index];
        source.loop = true;
        source.play();
    }

    public stopLoop(source: AudioSource) {
        source.stop();
        source.loop = false;
    }

    // ── Gameplay loop helpers ─────────────────────────────────────────

    /** Start looping the given clip index on a dedicated source. */
    public startLoop(index: number, volume: number = 1): void {
        this.stopCurrentLoop();
        if (!this.soundClips[index]) {
            console.warn(`SoundManager: No clip at index ${index}`);
            return;
        }
        const src = this.getAvailableSource();
        src.volume = volume;
        src.clip = this.soundClips[index];
        src.loop = true;
        src.play();
        this._loopSource = src;
        console.log(`[SoundManager] Loop started on index ${index}`);
    }

    /** Stop whatever loop is currently playing. */
    public stopCurrentLoop(): void {
        if (this._loopSource) {
            this._loopSource.stop();
            this._loopSource.loop = false;
            this._loopSource = null;
            console.log('[SoundManager] Loop stopped');
        }
    }

    // ── Existing helpers ──────────────────────────────────────────────
    public PlayStartingGameSound() {
        this.playOneShot(5, 6);
    }

    public playRandom(volume: number = 1) {
        if (!this.soundClips.length) return;
        const index = Math.floor(Math.random() * this.soundClips.length);
        const src = this.getAvailableSource();
        src.playOneShot(this.soundClips[index], volume);
    }

    public PlayButtonSound() {
        this.playOneShot(0, 9);
    }
}