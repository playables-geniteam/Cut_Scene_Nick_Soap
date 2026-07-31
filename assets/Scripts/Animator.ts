import { _decorator, Component, SkeletalAnimation, AnimationClip, AudioSource } from 'cc';
import { GameManager } from './GameManager';
import { ObjectsMover } from './ObjectsMover';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

@ccclass('IndexDelayOverride')
class IndexDelayOverride {
    @property({ tooltip: 'Clip index to override delay for' })
    public index: number = 0;

    @property({ tooltip: 'Delay in seconds to wait before this index plays' })
    public delay: number = 2;
}

@ccclass('Animator')
export class Animator extends Component {

    @property({ type: SkeletalAnimation, tooltip: 'The SkeletalAnimation component — clips are read directly from it' })
    public animator: SkeletalAnimation = null;

    @property({ tooltip: 'Default delay in seconds between each clip in the sequence' })
    public sequenceDelay: number = 2;

    @property({ type: [IndexDelayOverride], tooltip: 'Per-index delay overrides — if an index is listed here its delay is used instead of sequenceDelay' })
    public delayOverrides: IndexDelayOverride[] = [];

    @property({ tooltip: 'Crossfade duration in seconds for the soap animation transition' })
    public soapCrossFadeDuration: number = 0.3;

    @property({ tooltip: 'How many seconds before the clip ends to start the crossfade (exit time). Increase to blend earlier.' })
    public exitTimeOffset: number = 0.1;

    private _sequenceTimeout: any = null;

    start() { }
    update(deltaTime: number) { }

    public playByIndex(index: number): void {

        // return;
        // if(index)
let delay =0;

        setTimeout(() => {

    

 if (!this.animator) {
            console.warn('[Animator] No SkeletalAnimation assigned.');
            return;
        }

        const clips = this.animator.clips;

        if (index < 0 || index >= clips.length) {
            console.warn(`[Animator] Index ${index} is out of range. clips.length = ${clips.length}`);
            return;
        }

        const clip = clips[index];
        if (!clip) {
            console.warn(`[Animator] Clip at index ${index} is null.`);
            return;
        }

        this.animator.play(clip.name);
        console.log(`[Animator] Playing clip "${clip.name}" at index ${index}`);

        if (index === 4) {
            GameManager.instance?.enableMissT1_Mover3();
        }
        }, delay);



       
    }

    public playSequenceFrom(startIndex: number): void {
        if (!this.animator) {
            console.warn('[Animator] No SkeletalAnimation assigned.');
            return;
        }

        if (GameManager.instance?.Character1) GameManager.instance.Character1.active = false;
        if (GameManager.instance?.Character2) GameManager.instance.Character2.active = true;

        this.stopSequence();

        const clips = this.animator.clips;

        if (startIndex < 0 || startIndex >= clips.length) {
            console.warn(`[Animator] startIndex ${startIndex} is out of range. clips.length = ${clips.length}`);
            return;
        }

        this.playByIndex(startIndex);
        this._scheduleNext(startIndex + 1);
    }

    public stopSequence(): void {
        if (this._sequenceTimeout) {
            clearTimeout(this._sequenceTimeout);
            this._sequenceTimeout = null;
        }
    }

    private _getDelay(index: number): number {
        const override = this.delayOverrides.find(o => o.index === index);
        return override ? override.delay : this.sequenceDelay;
    }

    private _scheduleNext(index: number): void {
        const clips = this.animator.clips;
        if (index >= clips.length) return;

        const delay = this._getDelay(index);

        this._sequenceTimeout = setTimeout(() => {
            this._sequenceTimeout = null;
            this.playByIndex(index);
            this._scheduleNext(index + 1);
        }, delay * 600);
    }

    protected onDestroy(): void {
        this.stopSequence();
    }

    /**
     * Crossfades to clipIndex, but first waits until the current clip
     * reaches its exit point (clip duration - exitTimeOffset) so the
     * blend starts at a natural pose rather than mid-motion.
     * Falls back to immediate crossfade if timing can't be determined.
     */
    private _smoothCrossFade(clipIndex: number): void {
        const clips = this.animator.clips;
        if (clipIndex < 0 || clipIndex >= clips.length || !clips[clipIndex]) {
            console.warn(`[Animator] _smoothCrossFade: no clip at index ${clipIndex}`);
            return;
        }

        // Set target clip to loop so it never snaps back to frame 0 mid-blend
        clips[clipIndex].wrapMode = AnimationClip.WrapMode.Loop;

        // Calculate how long to wait before starting the crossfade
        // so it begins near the natural end of the current clip
        const state = this.animator.getState(this.animator.clips[clipIndex]?.name);
        const currentStateName = (this.animator as any).currentClip?.name ?? '';
        const currentState = currentStateName ? this.animator.getState(currentStateName) : null;

        let waitBeforeFade = 0;
        if (currentState) {
            const elapsed = currentState.time % currentState.duration;
            const remaining = currentState.duration - elapsed;
            // Wait until exitTimeOffset seconds before the clip ends
            waitBeforeFade = Math.max(0, (remaining - this.exitTimeOffset) * 1000);
        }

        setTimeout(() => {
            this.animator.crossFade(clips[clipIndex].name, this.soapCrossFadeDuration);
            console.log("Gell");
            console.log(`[Animator] CrossFade → "${clips[clipIndex].name}" (exit wait: ${waitBeforeFade.toFixed(0)}ms, fade: ${this.soapCrossFadeDuration}s)`);
        }, waitBeforeFade);
    }

    public PlayAnimSoap(): void {
        
      
        if (!this.animator) {
            console.warn('[Animator] No SkeletalAnimation assigned.');
            return;
        }
        GameManager.instance.useCamera5();

        setTimeout(() => {
            const clips = this.animator.clips;
            if (clips.length <= 2 || !clips[1] || !clips[2]) {
                console.warn('[Animator] Soap clips at index 1 or 2 are missing.');
                console.log(`[Animator] Total clips available: ${clips.length}`);
                return;
            }

            // Turn Particle1 on, then off after 1 second
            if (GameManager.instance.Particle1) {
                GameManager.instance.Particle1.active = true;
                GameManager.instance.soundManagerNode.getComponent(SoundManager).playOneShot(7);
                setTimeout(() => {
                    GameManager.instance.Particle1.active = false;
                }, 1500);
            }

            // crossfade to index 2
            this._smoothCrossFade(2);
            GameManager.instance.Soap.active = true;

            // +2s → crossfade to index 3
            setTimeout(() => {
                this._smoothCrossFade(3);

                // +7s → crossfade to index 0
                setTimeout(() => {
                    this._smoothCrossFade(0);
                    this.getComponent(AudioSource).play();
                    setTimeout(() => {
                        this.getComponent(AudioSource).play();
                    }, 1000);
                }, 7000);

            }, 2000);

        }, 1000);
    }
}