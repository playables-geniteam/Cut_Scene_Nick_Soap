import { _decorator, Component, Node, Vec3, Quat, clamp, tween } from 'cc';
import { EasyController, EasyControllerEvent } from './EasyController';

const { ccclass, property } = _decorator;

@ccclass('CameraController')
export class CameraController extends Component {

    @property(Node)
    target: Node = null;

    // ── Distance ────────────────────────────────────────────────────
    @property({ tooltip: 'Distance from target' })
    distance: number = 10;

    @property
    minDistance: number = 3;

    @property
    maxDistance: number = 20;

    // ── Height ──────────────────────────────────────────────────────
    @property({ tooltip: 'Vertical offset added to camera position above target' })
    heightOffset: number = 5;

    @property({ tooltip: 'How much of the heightOffset is applied to the lookAt point (0 = look at feet, 1 = look at full height offset)' })
    lookAtHeightFactor: number = 0.5;

    // ── Speed / Feel ─────────────────────────────────────────────────
    @property
    rotationSpeed: number = 1.0;

    @property
    zoomSpeed: number = 0.01;

    @property({ tooltip: 'How smoothly the camera follows the target (higher = snappier)' })
    smoothSpeed: number = 10.0;

    // ── Pitch Clamp ──────────────────────────────────────────────────
    @property({ tooltip: 'Minimum vertical angle (degrees)' })
    minPitch: number = -80;

    @property({ tooltip: 'Maximum vertical angle (degrees)' })
    maxPitch: number = 80;

    // ── Private State ────────────────────────────────────────────────
    private _currentYaw: number = 0;
    private _currentPitch: number = 20;
    private _initialOffset: Vec3 = new Vec3();
    private _useInitialPosition: boolean = true;

    private _originalTarget: Node = null;
    private _inputLocked: boolean = false;
    private _cinematicActive: boolean = false;
    private _returnPos: Vec3 = new Vec3();
    private _returnRot: Quat = new Quat();

    start() {
        if (this.target) {
            const currentPos = this.node.worldPosition;
            const targetPos = this.target.worldPosition;

            Vec3.subtract(this._initialOffset, currentPos, targetPos);

            // The orbit branch adds heightOffset on top of the spherical offset,
            // so we must strip it out before syncing angles — otherwise the orbit
            // formula re-adds it and the camera snaps on the very first touch.
            const orbitOffset = new Vec3(
                this._initialOffset.x,
                this._initialOffset.y - this.heightOffset,
                this._initialOffset.z
            );
            this._syncAnglesFromOffset(orbitOffset);

            console.log(`Camera Initialized:
            Position : ${currentPos.x.toFixed(3)}, ${currentPos.y.toFixed(3)}, ${currentPos.z.toFixed(3)}
            Yaw      : ${this._currentYaw.toFixed(2)}°
            Pitch    : ${this._currentPitch.toFixed(2)}°
            Distance : ${this.distance.toFixed(3)}`);
        }

        EasyController.on(EasyControllerEvent.CAMERA_ROTATE, this.onCameraRotate, this);
        EasyController.on(EasyControllerEvent.CAMERA_ZOOM, this.onCameraZoom, this);
    }

    onDestroy() {
        EasyController.off(EasyControllerEvent.CAMERA_ROTATE, this.onCameraRotate, this);
        EasyController.off(EasyControllerEvent.CAMERA_ZOOM, this.onCameraZoom, this);
    }

    private onCameraRotate(rx: number, ry: number) {
        if (this._inputLocked) return;
        this._useInitialPosition = false;
        this._currentPitch -= rx * this.rotationSpeed;
        this._currentYaw += ry * this.rotationSpeed;
        this._currentPitch = clamp(this._currentPitch, this.minPitch, this.maxPitch);
    }

    private onCameraZoom(delta: number) {
        if (this._inputLocked) return;
        this._useInitialPosition = false;
        this.distance += delta * this.zoomSpeed;
        this.distance = clamp(this.distance, this.minDistance, this.maxDistance);
    }

    update(deltaTime: number) {
        if (!this.target) return;

        const targetPos = this.target.worldPosition;
        let desiredPos: Vec3;

        if (this._useInitialPosition) {
            // Hold the editor-placed offset — no angle re-sync here.
            // _currentYaw/_currentPitch/distance were already synced once in start(),
            // so the first touch transitions seamlessly into orbit mode.
            desiredPos = new Vec3(
                targetPos.x + this._initialOffset.x,
                targetPos.y + this._initialOffset.y,
                targetPos.z + this._initialOffset.z
            );
        } else {
            const yawRad = this._currentYaw * Math.PI / 180;
            const pitchRad = this._currentPitch * Math.PI / 180;

            const horizontalDist = this.distance * Math.cos(pitchRad);
            const offsetX = horizontalDist * Math.sin(yawRad);
            const offsetZ = horizontalDist * Math.cos(yawRad);
            const offsetY = this.distance * Math.sin(pitchRad);

            desiredPos = new Vec3(
                targetPos.x + offsetX,
                targetPos.y + offsetY + this.heightOffset,
                targetPos.z + offsetZ
            );
        }

        // During cinematic hold, smooth the target position to kill rigidbody jitter
        if (this._cinematicActive) {
            const lookAt = new Vec3(
                targetPos.x,
                targetPos.y + this.heightOffset * this.lookAtHeightFactor,
                targetPos.z
            );
            const yawRad = this._currentYaw * Math.PI / 180;
            const pitchRad = this._currentPitch * Math.PI / 180;
            const hDist = this.distance * Math.cos(pitchRad);
            const smoothed = new Vec3(
                targetPos.x + hDist * Math.sin(yawRad),
                targetPos.y + this.distance * Math.sin(pitchRad) + this.heightOffset,
                targetPos.z + hDist * Math.cos(yawRad)
            );
            this.node.setWorldPosition(smoothed);
            this.node.lookAt(lookAt);
            return;
        }

        this.node.setWorldPosition(desiredPos);

        const lookAtPos = new Vec3(
            targetPos.x,
            targetPos.y + this.heightOffset * this.lookAtHeightFactor,
            targetPos.z
        );
        this.node.lookAt(lookAtPos);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    /**
     * Derives _currentYaw, _currentPitch, and distance from a world-space
     * offset vector (camera pos - target pos). Called once at start() and
     * again when a cinematic ends to restore exact orbit state.
     */
    private _syncAnglesFromOffset(offset: Vec3): void {
        const horizontalDist = Math.sqrt(offset.x * offset.x + offset.z * offset.z);
        this._currentYaw = Math.atan2(offset.x, offset.z) * 180 / Math.PI;
        this._currentPitch = clamp(
            Math.atan2(offset.y, horizontalDist) * 180 / Math.PI,
            this.minPitch, this.maxPitch
        );
        this.distance = offset.length();
    }

    // ── Cinematic API ────────────────────────────────────────────────

    public startCinematic(cinematicTarget: Node, durationSec: number, tweenDuration: number = 1.2): void {
        if (!cinematicTarget) return;

        this._originalTarget = this.target;
        this._inputLocked = true;
        this._useInitialPosition = false;
        this._cinematicActive = true;

        Vec3.copy(this._returnPos, this.node.worldPosition);
        Quat.copy(this._returnRot, this.node.worldRotation);

        const startPos = this.node.worldPosition.clone();
        const yawRad = this._currentYaw * Math.PI / 180;
        const pitchRad = this._currentPitch * Math.PI / 180;
        const hDist = this.distance * Math.cos(pitchRad);
        const destPos = new Vec3(
            cinematicTarget.worldPosition.x + hDist * Math.sin(yawRad),
            cinematicTarget.worldPosition.y + this.distance * Math.sin(pitchRad) + this.heightOffset,
            cinematicTarget.worldPosition.z + hDist * Math.cos(yawRad)
        );

        const proxy = { x: startPos.x, y: startPos.y, z: startPos.z };

        tween(proxy)
            .to(tweenDuration,
                { x: destPos.x, y: destPos.y, z: destPos.z },
                {
                    easing: 'cubicInOut',
                    onUpdate: () => {
                        if (!this._cinematicActive) return;
                        this.node.setWorldPosition(proxy.x, proxy.y, proxy.z);
                        const lookAt = new Vec3(
                            cinematicTarget.worldPosition.x,
                            cinematicTarget.worldPosition.y + this.heightOffset * this.lookAtHeightFactor,
                            cinematicTarget.worldPosition.z
                        );
                        this.node.lookAt(lookAt);
                    }
                }
            )
            .call(() => {
                this.target = cinematicTarget;
                console.log(`[CameraController] Cinematic holding on "${cinematicTarget.name}"`);
            })
            .delay(Math.max(0, durationSec - tweenDuration))
            .call(() => {
                this._endCinematic(tweenDuration);
            })
            .start();

        console.log(`[CameraController] Cinematic started → "${cinematicTarget.name}" | hold: ${durationSec}s | tween: ${tweenDuration}s`);
    }

    private _endCinematic(tweenDuration: number): void {
        if (!this._originalTarget) return;

        const destTarget = this._originalTarget;
        this._originalTarget = null;

        const startPos = this.node.worldPosition.clone();
        const startRot = this.node.worldRotation.clone();
        const slerpQuat = new Quat();
        const proxy = { x: startPos.x, y: startPos.y, z: startPos.z };

        tween(proxy)
            .to(tweenDuration,
                { x: this._returnPos.x, y: this._returnPos.y, z: this._returnPos.z },
                {
                    easing: 'cubicInOut',
                    onUpdate: (p, ratio) => {
                        this.node.setWorldPosition(proxy.x, proxy.y, proxy.z);
                        Quat.slerp(slerpQuat, startRot, this._returnRot, ratio);
                        this.node.setWorldRotation(slerpQuat);
                    }
                }
            )
            .call(() => {
                this.node.setWorldPosition(this._returnPos);
                this.node.setWorldRotation(this._returnRot);

                this.target = destTarget;
                this._inputLocked = false;
                this._cinematicActive = false;

                // Re-sync angles from the exact return position
                const offset = new Vec3();
                Vec3.subtract(offset, this._returnPos, destTarget.worldPosition);
                this._syncAnglesFromOffset(offset);

                console.log('[CameraController] Cinematic ended — returned to exact start position');
            })
            .start();
    }

    public getCurrentYaw(): number {
        return this._currentYaw;
    }
}