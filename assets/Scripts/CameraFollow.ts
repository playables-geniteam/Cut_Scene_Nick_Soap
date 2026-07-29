import { _decorator, Component, Node, Vec3, Quat, math } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CameraFollow')
export class CameraFollow extends Component {

    @property(Node)
    target: Node = null;

    @property({ tooltip: 'How smoothly the camera follows (higher = snappier)' })
    smoothSpeed: number = 8.0;

    // ── Runtime Position Offset ──────────────────────────────────────
    @property({ tooltip: 'Position offset X (left/right)' })
    offsetX: number = 0;

    @property({ tooltip: 'Position offset Y (up/down)' })
    offsetY: number = 0;

    @property({ tooltip: 'Position offset Z (forward/back)' })
    offsetZ: number = 0;

    // ── Runtime Rotation Offset ──────────────────────────────────────
    @property({ tooltip: 'Rotation offset X / tilt (degrees)' })
    rotationOffsetX: number = 0;

    @property({ tooltip: 'Rotation offset Y / pan (degrees)' })
    rotationOffsetY: number = 0;

    @property({ tooltip: 'Rotation offset Z / roll (degrees)' })
    rotationOffsetZ: number = 0;

    // ── Private ──────────────────────────────────────────────────────
    private _smoothPos: Vec3 = new Vec3();
    private _desiredPos: Vec3 = new Vec3();
    private _offsetRot: Quat = new Quat();
    private _baseRot: Quat = new Quat();
    private _initialized: boolean = false;

    start() {
        if (!this.target) return;

        // Snap to starting position immediately — no fly-in on first frame
        this._updateDesired();
        Vec3.copy(this._smoothPos, this._desiredPos);
        this.node.setWorldPosition(this._smoothPos);
        this._initialized = true;
    }

    update(deltaTime: number) {
        if (!this.target || !this._initialized) return;

        // 1. Compute desired position
        this._updateDesired();

        // 2. Exponential lerp — frame-rate independent
        const t = 1 - Math.exp(-this.smoothSpeed * deltaTime);
        Vec3.lerp(this._smoothPos, this._smoothPos, this._desiredPos, t);
        this.node.setWorldPosition(this._smoothPos);

        // 3. Match target rotation then apply offset on top
        Quat.copy(this._baseRot, this.target.worldRotation);

        if (this.rotationOffsetX !== 0 || this.rotationOffsetY !== 0 || this.rotationOffsetZ !== 0) {
            Quat.fromEuler(this._offsetRot, this.rotationOffsetX, this.rotationOffsetY, this.rotationOffsetZ);
            Quat.multiply(this._baseRot, this._baseRot, this._offsetRot);
        }

        this.node.setWorldRotation(this._baseRot);
    }

    private _updateDesired() {
        const tp = this.target.worldPosition;
        this._desiredPos.set(
            tp.x + this.offsetX,
            tp.y + this.offsetY,
            tp.z + this.offsetZ
        );
    }
}