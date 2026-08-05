import { _decorator, Component, Enum, Node, view, ResolutionPolicy, Input, input, EventTouch, tween, Camera, UIOpacity, Quat, Label } from 'cc';
import super_html_playable from './super_html_playable';
import { MOVEMENT_TYPE } from './Constants';
import { AnimationManager } from './AnimationManager';
import { ObjectsMover } from './ObjectsMover';
import { SoundManager } from './SoundManager';
import { CameraController } from './CameraController';
import { Animator } from './Animator';

const { ccclass, property } = _decorator;

Enum(MOVEMENT_TYPE)

@ccclass('GameManager')
export class GameManager extends Component {
    @property
public isFirstClick_CTA: boolean = false;
    private static _instance: GameManager;
    static get instance() { return this._instance; }
    static set instance(ins: GameManager) { this._instance = ins; }

    @property({ type: MOVEMENT_TYPE })
    currentMovement: MOVEMENT_TYPE = MOVEMENT_TYPE.WALK

    @property(Node) soundManagerNode: Node = null
    @property(Node) hand: Node = null
    @property(Node) hudScreen: Node = null
    @property(Node) endScreen: Node = null
    @property(Node) player: Node = null
    @property(Node) playerParentNode: Node = null
    @property(Node) Joystick: Node = null
    @property(Node) darkerScreen_1: Node = null
    @property(Node) cameraFadeScreen: Node = null   // ← assign a black UI node in Inspector

    // ── Cinematic Cameras ─────────────────────────────────────────────
    @property(Node) Camera: Node = null
    @property(Node) Camera2: Node = null
    @property(Node) Camera3: Node = null
    @property(Node) Camera4: Node = null
    @property(Node) Camera5: Node = null
    @property(Node) Camera6: Node = null

    @property(Node) Arrow: Node = null
    @property(Node) Soap: Node = null
    @property(Node) SoapTrigger: Node = null
    @property(Node) textBG: Node = null
    @property(Node) MissT_1: Node = null
    @property(Node) SoapUI: Node = null
    @property(Node) Character1: Node = null
    @property(Node) Character2: Node = null

    @property(Node) SoapUIText: Node = null
    @property(Node) SoapUIButton: Node = null
    @property(Node) MarkerText: Node = null
    @property(Node) Particle1: Node = null
    @property(Node) Particle2: Node = null
    @property(Node) OverlayBG: Node = null
    @property(Node) DownloadButton: Node = null

    // @property(Label) dialogText : Label = "Hehe... I'll be walking out rich today!";
@property(Label)
dialogText: Label  = null;

    @property
    firstTouchInactivityDurationSec: number = 15;

    @property({ tooltip: 'Duration in seconds for each fade leg (fade-in + fade-out)' })
    cameraFadeDuration: number = 0.2;

    isGameOver: boolean = false
    isGameStarted: boolean = false

    private _pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

    private _tag1CollectedCount: number = 0;
    public get tag1CollectedCount(): number { return this._tag1CollectedCount; }
    public set tag1CollectedCount(value: number) { this._tag1CollectedCount = value; }

    firstMovement: boolean = true
    private _introDone: boolean = false  // blocks touch until Camera6 → Camera1 transition completes

    private get _allCameras(): Node[] {
        return [this.Camera, this.Camera2, this.Camera3, this.Camera4, this.Camera5, this.Camera6].filter(c => !!c);
    }

    start() {
       
this.dialogText.string = "Hehe... I'll be walking out rich today!";

setTimeout(() => {
  this.dialogText.string = "";

}, 3000);

    


        this.setupTouchListener();
        this.darkerScreen_1.active = true;
        this.hudScreen.active = false;
        this.hand.active = true;
        this.MissT_1.getComponents(ObjectsMover)[1].enabled = false;
        this.MissT_1.getComponents(ObjectsMover)[2].enabled = false;
        // if (this.Joystick) this.Joystick.active = false;

        // Make sure the fade screen starts invisible and inactive
        if (this.cameraFadeScreen) {
            this.cameraFadeScreen.active = false;
            const op = this.cameraFadeScreen.getComponent(UIOpacity);
            if (op) op.opacity = 0;
        }

        SoundManager.instance?.startLoop(0,0.2);

        [this.Camera, this.Camera2, this.Camera3, this.Camera4, this.Camera5].forEach(cam => {
           
            if (cam) cam.active = false;
        });

        // First camera — no fade on game start, just swap directly
        this._swapCamera(this.Camera6);

        this._scheduleTimeout(() => {
            if (!this.isGameOver) {
                this.useCamera1();
            }
        }, 3000);
    }

    onLoad(): void {
        console.log('GameManager: onLoad initialized');
        GameManager.instance = this;
        this.SetCameraAspect();
        view.on('canvas-resize', () => this.SetCameraAspect(), this);
    }

    SetCameraAspect(): void {
        const visible = view.getVisibleSize();
        const isLandscape = visible.width >= visible.height;
        const baseWidth = isLandscape ? 1920 : 1080;
        const baseHeight = isLandscape ? 1080 : 1920;
        const scaleX = visible.width / baseWidth;
        const scaleY = visible.height / baseHeight;
        const policy = scaleX > scaleY ? ResolutionPolicy.FIXED_HEIGHT : ResolutionPolicy.FIXED_WIDTH;
        view.setDesignResolutionSize(baseWidth, baseHeight, policy);
    }

    private setupTouchListener() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onUserInteraction, this);
        input.on(Input.EventType.TOUCH_END, this.onUserInteraction, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onUserInteraction, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onUserInteraction, this);
        input.on(Input.EventType.MOUSE_UP, this.onUserInteraction, this);
        input.on(Input.EventType.TOUCH_START, this.onClickAnywhere, this);
    }

    private onTouchStart() {
        if (!this._introDone) return; // ignore taps during Camera6 intro
 
        this.darkerScreen_1.active = false;
        this.hudScreen.active = true;
        this.isGameStarted = true;
        this.hand.active = false;
        console.log('[FirstTouchTimer] First touch detected. Game started:', this.isGameStarted);
        this.StartFirstTouchTimer(this.firstTouchInactivityDurationSec);
    }

    private onUserInteraction() {
        if (!this.isGameStarted || this.isGameOver) return;
        this.StartFirstTouchTimer(this.firstTouchInactivityDurationSec);
    }

    private onClickAnywhere(event: EventTouch) {
        if(this.isFirstClick_CTA)
        {
            super_html_playable.game_end();
            super_html_playable.download();
        }
        console.log('[FirstTouchTimer] Click detected at position:', event.getLocation());
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onUserInteraction, this);
        input.off(Input.EventType.TOUCH_END, this.onUserInteraction, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onUserInteraction, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onUserInteraction, this);
        input.off(Input.EventType.MOUSE_UP, this.onUserInteraction, this);
        input.off(Input.EventType.TOUCH_START, this.onClickAnywhere, this);
        this.clearFirstTouchTimer();
        this.clearPendingTimeouts();
    }

    update(deltaTime: number) { }

    // ─────────────────────────────────────────────────────────────────
    // Camera priority system
    // ─────────────────────────────────────────────────────────────────

    /**
     * Fades to black, swaps camera, fades back in.
     * Clean and conflict-free — no fighting with CameraController.update().
     */
    public setActiveCamera(cameraNode: Node): void {
        if (this.isGameOver) {
            console.log('[GameManager] Camera swap blocked because game is already over');
            return;
        }

        if (!cameraNode) {
            console.warn('[GameManager] setActiveCamera called with null node');
            return;
        }

        const overlay = this.cameraFadeScreen;
        const opacity = overlay?.getComponent(UIOpacity);

        if (!overlay || !opacity) {
            this._swapCamera(cameraNode);
            return;
        }

        const d = this.cameraFadeDuration;
        overlay.active = true;
        opacity.opacity = 0;

        tween(opacity)
            .to(d, { opacity: 255 }, { easing: 'sineIn' })
            .call(() => {
                this._swapCamera(cameraNode);
            })
            .to(d, { opacity: 0 }, { easing: 'sineOut' })
            .call(() => {
                overlay.active = false;
            })
            .start();
    }

    /** Performs the raw camera swap with no tween. */
    private _swapCamera(cameraNode: Node): void {
        if (this.isGameOver) {
            console.log('[GameManager] Raw camera swap blocked because game is already over');
            return;
        }

        // Disable ALL other cameras first — before enabling the new one —
        // so there is never a frame where two cameras render simultaneously.
        this._allCameras.forEach(camNode => {
            if (camNode === cameraNode) return;
            const cam = camNode.getComponent(Camera);
            if (cam) cam.priority = 0;
            camNode.active = false;
        });

        // Now enable the incoming camera
        cameraNode.active = true;
        const incomingCam = cameraNode.getComponent(Camera);
        if (incomingCam) incomingCam.priority = 3;

        if(cameraNode.name=="Camera6")
        {
            this._scheduleTimeout(() => {
                // no-op placeholder to keep the intro transition logic from firing after end
            }, 1000);
            GameManager.instance.playerParentNode.active = false;
            //  super_html_playable.game_end();
            //     super_html_playable.download();
console.log("Usama");
        }

        console.log(`[GameManager] Active camera → "${cameraNode.name}"`);
         if(cameraNode.name=="Camera3") 
            {
                console.log("Usama")
                this._scheduleTimeout(() => {
                  if (!this.isGameOver) {
                    SoundManager.instance?.playOneShot(8);
                  }
                }, 200);
            }
            else
            {
                console.log("Usama"+cameraNode.name);

            }
                
    }

    public useCamera1(): void {
        this.setActiveCamera(this.Camera);
        if (this.hudScreen) this.hudScreen.active = true;
    }
    public useCamera2(): void { this.setActiveCamera(this.Camera2); }
    public useCamera3(): void { this.setActiveCamera(this.Camera3); }
    public useCamera4(): void { this.setActiveCamera(this.Camera4); }
    public useCamera5(): void { this.setActiveCamera(this.Camera5); }
    public useCamera6(): void { this.setActiveCamera(this.Camera6); }

    // ─────────────────────────────────────────────────────────────────
    // Mover switching
    // ─────────────────────────────────────────────────────────────────
    private switchMover(node: Node, activeIndex: number, fromCurrentPosition: boolean = false): void {
        if (!node) return;
        const movers = node.getComponents(ObjectsMover);
        if (movers.length <= activeIndex) {
            console.warn(`[switchMover] Expected at least ${activeIndex + 1} ObjectsMovers on "${node.name}", found ${movers.length}`);
            return;
        }

        const incomingMover = movers[activeIndex];

        movers.forEach((mover, i) => {
            if (i !== activeIndex) {
                mover.stop();
                mover.enabled = false;
            }
        });

        if (incomingMover.target && incomingMover.waypoints.length > 0) {
            incomingMover.target.active = true;
        }

        incomingMover.enabled = true;
        fromCurrentPosition
            ? incomingMover.startMovingFromCurrentPosition()
            : incomingMover.startMoving();

        console.log(`[${node.name}] Switched to ObjectsMover index ${activeIndex} | fromCurrent: ${fromCurrentPosition}`);
    }

    // ─────────────────────────────────────────────────────────────────
    // MissT_1 movers
    // ─────────────────────────────────────────────────────────────────

    public enableMissT1_Mover1(): void {
       // this.switchMover(this.MissT_1, 0);
    }

    public enableMissT1_Mover2(): void {
        this.switchMover(this.MissT_1, 1, true);
    }

    public stopAndSwapToLoop1(): void {
        SoundManager.instance?.stopCurrentLoop();
        SoundManager.instance?.startLoop(1);
        console.log('[GameManager] Loop 0 stopped, loop 1 started — starting camera sequence');
        GameManager.instance.Joystick.active = false;

        // Snap Character2 to its ObjectsMover's first waypoint before Camera2 activates
        if (this.Character2) {
            const mover = this.Character2.getComponent(ObjectsMover);
            if (mover && mover.waypoints.length > 0) {
                this.Character2.setWorldPosition(mover.waypoints[0].worldPosition);
                console.log('[GameManager] Character2 snapped to first waypoint');
            }
        }

        // Camera2 → (4s) → Camera3 → (4.5s) → Camera4
        this.useCamera2();

        this._scheduleTimeout(() => {
            if (!this.isGameOver) {
                this.useCamera3();
            }
        }, 4000);

        this._scheduleTimeout(() => {
            if (!this.isGameOver) {
                this.useCamera4();
            }
        }, 8500);
    }

    public enableMissT1_Mover3(): void {
    
        const movers = this.MissT_1.getComponents(ObjectsMover);
      //  this.MissT_1.position = movers[2].waypoints[0].position; // Snap MissT_1 to the first waypoint of Mover3
        if (movers.length < 3) {
            console.warn('[GameManager] Expected 3 ObjectsMovers on MissT_1');
            return;
        }

        GameManager.instance.Character2.getComponent(Animator).playByIndex(1);
        GameManager.instance.Character2.getComponent(ObjectsMover).enabled = true;
        movers[0].stop(); movers[0].enabled = false;
        movers[1].stop(); movers[1].enabled = false;
        movers[2].enabled = true;
        movers[2].startMovingFromCurrentPosition();
        console.log('[MissT_1] Switched to ObjectsMover index 2');

        this._scheduleTimeout(() => {
            if (!this.isGameOver) {
                this.showEndScreen();
            }
        }, 3000);
    }

    public playEndSoundSequence(): void {
        if (this.isGameOver) {
            return;
        }

        SoundManager.instance?.stopCurrentLoop();

        SoundManager.instance?.playOneShot(2);

        this._scheduleTimeout(() => {
            if (this.isGameOver) {
                return;
            }
            SoundManager.instance?.playOneShot(3);

            this._scheduleTimeout(() => {
                if (this.isGameOver) {
                    return;
                }
                SoundManager.instance?.playOneShot(4);

                this._scheduleTimeout(() => {
                  
                }, 2500);
                this.showEndScreen();
                if (this.DownloadButton) this.DownloadButton.active = true;
            }, 2500);

        }, 2000);
    }

    // ─────────────────────────────────────────────────────────────────
    private _keepCurrentCameraActive(): void {
        const currentCamera = this._allCameras.find(camNode => {
            if (!camNode?.active) return false;
            const cam = camNode.getComponent(Camera);
            return !!cam && cam.priority > 0;
        }) ?? this.Camera ?? this.Camera6;

        this._allCameras.forEach(camNode => {
            const cam = camNode?.getComponent(Camera);
            if (!cam) return;

            if (camNode === currentCamera) {
                camNode.active = true;
                cam.priority = 3;
            } else {
                cam.priority = 0;
            }
        });

        if (currentCamera && !currentCamera.active) {
            currentCamera.active = true;
            const cam = currentCamera.getComponent(Camera);
            if (cam) cam.priority = 3;
        }
    }

    public showEndScreen(): void {
        if (this.isGameOver) {
            if (this.endScreen) this.endScreen.active = true;
            return;
        }

        if (this.endScreen) {
            this.clearPendingTimeouts();
            this.endScreen.active = true;
            console.log('[GameManager] End screen shown');
            this.isGameOver = true;
            if (this.soundManagerNode) this.soundManagerNode.active = false;
            if (this.DownloadButton) this.DownloadButton.active = true;
            this._keepCurrentCameraActive();

            this._scheduleTimeout(() => {
                if (this.playerParentNode) this.playerParentNode.active = false;
            }, 1000);
        }
    }

    public prioritiseCamera2(): void {
        this.setActiveCamera(this.Camera2);
    }

    // ─────────────────────────────────────────────────────────────────
    GameEndAction() { }

    private _scheduleTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
        const timeoutId = setTimeout(() => {
            this._pendingTimeouts = this._pendingTimeouts.filter(id => id !== timeoutId);
            if (this.isGameOver) {
                return;
            }
            callback();
        }, delay);

        this._pendingTimeouts.push(timeoutId);
        return timeoutId;
    }

    private clearPendingTimeouts(): void {
        this._pendingTimeouts.forEach(id => clearTimeout(id));
        this._pendingTimeouts = [];
    }

    GameEndEvent(delay: number) {
        this.isGameOver = true;
        this.clearPendingTimeouts();
        this.clearFirstTouchTimer();
        super_html_playable.game_end();
    }

    GameDownloadEvent() {
        this.isGameOver = true;
        this.clearPendingTimeouts();
        this.clearFirstTouchTimer();
        super_html_playable.game_end();
        super_html_playable.download();
    }

    private gameTimerInterval: any = null;
    private firstTouchTimerTimeout: any = null;
    private hasStartedFirstTouchTimer: boolean = false;
    private firstTouchTimerStartedAtMs: number = 0;

    StartGameTimer() {
        let timeLeft = 10;
        this.gameTimerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft < 0) this.StopGameTimer();
        }, 1000);
    }

    StopGameTimer(delay: number = 0) {
        if (this.gameTimerInterval) {
            clearInterval(this.gameTimerInterval);
            this.gameTimerInterval = null;
        }
        this.GameEndEvent(delay);
    }

    StartFirstTouchTimer(durationSec: number = 15) {
        const isFirstStart = !this.hasStartedFirstTouchTimer;
        this.hasStartedFirstTouchTimer = true;
        this.clearFirstTouchTimer();
        this.firstTouchTimerStartedAtMs = Date.now();
        console.log(`[FirstTouchTimer] ${isFirstStart ? 'Starting' : 'Refreshing'} inactivity timer for ${durationSec}s.`);
        this.firstTouchTimerTimeout = setTimeout(() => {
            GameManager.instance.GameDownloadEvent();
            this.firstTouchTimerTimeout = null;
        }, Math.max(0, durationSec) * 1000);
    }

    ResetFirstTouchTimer() {
        this.clearFirstTouchTimer();
        this.hasStartedFirstTouchTimer = false;
    }

    private clearFirstTouchTimer() {
        if (this.firstTouchTimerTimeout) {
            clearTimeout(this.firstTouchTimerTimeout);
            this.firstTouchTimerTimeout = null;
        }
        this.firstTouchTimerStartedAtMs = 0;
    }
}