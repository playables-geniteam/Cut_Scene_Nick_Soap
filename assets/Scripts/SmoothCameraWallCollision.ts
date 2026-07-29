import { _decorator, Component, Node, Vec3, PhysicsSystem, geometry, math } from 'cc';
import { CameraController } from './CameraController';
import { ObjectTag } from './ObjectTag';
import { ObjectTags } from './Constants';
const { ccclass, property } = _decorator;

@ccclass('SmoothCameraWallCollision')
export class SmoothCameraWallCollision extends Component {

    @property(Node)
    public target: Node = null!;

    @property({ tooltip: 'Normal follow distance — change live in Inspector' })
    public defaultDistance: number = 5;

    @property({ tooltip: 'Closest allowed distance — change live in Inspector' })
    public minDistance: number = 1;

    @property({ tooltip: 'Extra space from walls — change live in Inspector' })
    public wallBuffer: number = 0.2;

    @property({ tooltip: 'Collider node name/tag keyword treated as wall' })
    public wallTag: string = 'wall';

    @property({ tooltip: 'Smoothing duration — change live in Inspector' })
    public smoothTime: number = 0.15;

    @property({ tooltip: 'How fast camera returns to default distance — change live in Inspector' })
    public recoverSpeed: number = 8;

    @property({ tooltip: 'Extra ray sample offsets around target — change live in Inspector' })
    public raySampleRadius: number = 0;

    @property({ tooltip: 'How fast camera moves inward when occluded — change live in Inspector' })
    public occlusionInSpeed: number = 30;

    @property({ tooltip: 'Keep occlusion state for a short time to avoid edge flicker — change live' })
    public occlusionHoldTime: number = 0.08;

    @property({ tooltip: 'Minimum distance delta before applying — change live in Inspector' })
    public distanceDeadzone: number = 0.005;

    @property({ tooltip: 'Max inward distance change per second — change live in Inspector' })
    public maxInwardChangePerSecond: number = 20;

    @property({ tooltip: 'Max outward distance change per second — change live in Inspector' })
    public maxOutwardChangePerSecond: number = 10;

    @property({ tooltip: 'How quickly sticky wall distance relaxes outward — change live' })
    public stickyRelaxSpeed: number = 2.5;

    private _currentDistance: number = 5;
    private _cameraController: CameraController | null = null;
    private _baseDistance: number = 5;
    private _ray: geometry.Ray = new geometry.Ray();
    private _isDistanceInitialized: boolean = false;
    private _dir: Vec3 = new Vec3();
    private _right: Vec3 = new Vec3();
    private _up: Vec3 = new Vec3(0, 1, 0);
    private _sampleFrom: Vec3 = new Vec3();
    private _tmpCameraPos: Vec3 = new Vec3();
    private _tmpTargetPos: Vec3 = new Vec3();
    private _defaultCameraPos: Vec3 = new Vec3();
    private _sampleOffsets: Vec3[] = [new Vec3(), new Vec3(), new Vec3(), new Vec3()];
    private _occlusionHoldRemaining: number = 0;
    private _stickyHitDistance: number = 0;
    private _hasStickyHit: boolean = false;

    // ── Track previous Inspector values to detect live changes ──────
    private _prevDefaultDistance: number = -1;
    private _prevMinDistance: number = -1;

    start() {
        this.initializeDistanceState();
    }

    private initializeDistanceState() {
        if (this._isDistanceInitialized) return;

        this._cameraController = this.getComponent(CameraController);

        if (this._cameraController) {
            this._baseDistance = this._cameraController.distance;
            this.defaultDistance = this._cameraController.distance;
        } else {
            this._baseDistance = this.defaultDistance;
        }

        this._currentDistance = this.defaultDistance;
        this._prevDefaultDistance = this.defaultDistance;
        this._prevMinDistance = this.minDistance;
        this._isDistanceInitialized = true;
    }

    lateUpdate(deltaTime: number) {
        if (!this.target) return;
        this.initializeDistanceState();

        // ── Detect live Inspector changes and apply immediately ──────
        if (this.defaultDistance !== this._prevDefaultDistance) {
            this._baseDistance = this.defaultDistance;
            this._currentDistance = this.defaultDistance;
            if (this._cameraController) {
                this._cameraController.distance = this.defaultDistance;
            }
            this._prevDefaultDistance = this.defaultDistance;
        }

        if (this.minDistance !== this._prevMinDistance) {
            this._currentDistance = math.clamp(this._currentDistance, this.minDistance, this.defaultDistance);
            this._prevMinDistance = this.minDistance;
        }

        // Calculate current ray from target to camera
        const cameraPos = this.node.worldPosition;
        const targetPos = this.target.worldPosition;
        this._tmpCameraPos.set(cameraPos);
        this._tmpTargetPos.set(targetPos);

        Vec3.subtract(this._dir, this._tmpCameraPos, this._tmpTargetPos);
        const currentDistance = this._dir.length();
        if (currentDistance <= 0.0001) return;
        Vec3.normalize(this._dir, this._dir);
        Vec3.cross(this._right, this._dir, this._up);
        if (this._right.lengthSqr() <= 0.000001) {
            this._right.set(1, 0, 0);
        } else {
            Vec3.normalize(this._right, this._right);
        }

        this._defaultCameraPos.set(
            this._tmpTargetPos.x + this._dir.x * this.defaultDistance,
            this._tmpTargetPos.y + this._dir.y * this.defaultDistance,
            this._tmpTargetPos.z + this._dir.z * this.defaultDistance,
        );

        const maxDistance = this.defaultDistance + this.wallBuffer;
        const mask = 0xffffffff;
        const queryTrigger = false;

        let hitDistance = this.defaultDistance;
        let foundOcclusion = false;

        foundOcclusion = this.updateHitDistanceByRay(
            this._tmpTargetPos,
            this._defaultCameraPos,
            mask,
            maxDistance,
            queryTrigger,
            hitDistance
        );
        if (foundOcclusion) {
            hitDistance = this._lastHitDistance;
        }

        if (this.raySampleRadius > 0) {
            const r = this.raySampleRadius;
            this._sampleOffsets[0].set(this._right.x * r, this._right.y * r, this._right.z * r);
            this._sampleOffsets[1].set(-this._right.x * r, -this._right.y * r, -this._right.z * r);
            this._sampleOffsets[2].set(0, r, 0);
            this._sampleOffsets[3].set(0, -r, 0);

            for (let i = 0; i < this._sampleOffsets.length; i++) {
                Vec3.add(this._sampleFrom, this._tmpTargetPos, this._sampleOffsets[i]);
                const occluded = this.updateHitDistanceByRay(
                    this._sampleFrom,
                    this._defaultCameraPos,
                    mask,
                    maxDistance,
                    queryTrigger,
                    hitDistance
                );
                if (occluded) {
                    foundOcclusion = true;
                    hitDistance = this._lastHitDistance;
                }
            }
        }

        hitDistance = math.clamp(hitDistance, this.minDistance, this.defaultDistance);
        if (foundOcclusion && hitDistance >= this.defaultDistance - this.distanceDeadzone) {
            foundOcclusion = false;
        }

        let targetDistance = this.defaultDistance;
        if (foundOcclusion) {
            this._occlusionHoldRemaining = this.occlusionHoldTime;
            if (!this._hasStickyHit) {
                this._stickyHitDistance = hitDistance;
                this._hasStickyHit = true;
            } else {
                this._stickyHitDistance = Math.min(this._stickyHitDistance, hitDistance);
            }
            targetDistance = this._stickyHitDistance;
        } else {
            if (this._occlusionHoldRemaining > 0) {
                this._occlusionHoldRemaining = Math.max(0, this._occlusionHoldRemaining - deltaTime);
                targetDistance = this._currentDistance;
            } else {
                this._hasStickyHit = false;
            }
        }

        if (!foundOcclusion && this._occlusionHoldRemaining <= 0 && this._cameraController) {
            if (Math.abs(this._cameraController.distance - this._currentDistance) > this.distanceDeadzone) {
                this._baseDistance = this._cameraController.distance;
            }
            this.defaultDistance = this._baseDistance;
        }

        const speed = foundOcclusion ? this.occlusionInSpeed : this.recoverSpeed;
        let nextDistance = this.lerp(
            this._currentDistance,
            targetDistance,
            math.clamp(deltaTime * speed, 0, 1)
        );
        const maxInwardStep = this.maxInwardChangePerSecond * deltaTime;
        const maxOutwardStep = this.maxOutwardChangePerSecond * deltaTime;
        const delta = nextDistance - this._currentDistance;
        if (delta < 0) {
            nextDistance = this._currentDistance + Math.max(delta, -maxInwardStep);
        } else if (delta > 0) {
            nextDistance = this._currentDistance + Math.min(delta, maxOutwardStep);
        }
        this._currentDistance = nextDistance;

        const controllerDistance = this._cameraController ? this._cameraController.distance : this._currentDistance;
        if (Math.abs(this._currentDistance - controllerDistance) < this.distanceDeadzone) {
            this._currentDistance = controllerDistance;
        }

        if (this._cameraController) {
            if (Math.abs(this._cameraController.distance - this._currentDistance) > this.distanceDeadzone) {
                this._cameraController.distance = this._currentDistance;
            }
        }
    }

    private _lastHitDistance: number = 0;

    private updateHitDistanceByRay(
        from: Vec3,
        to: Vec3,
        mask: number,
        maxDistance: number,
        queryTrigger: boolean,
        currentHitDistance: number
    ): boolean {
        geometry.Ray.fromPoints(this._ray, from, to);
        if (!PhysicsSystem.instance.raycast(this._ray, mask, maxDistance, queryTrigger)) {
            return false;
        }

        const results = PhysicsSystem.instance.raycastResults;
        let hit = false;
        let closest = currentHitDistance;
        for (let i = 0; i < results.length; i++) {
            const node = results[i].collider.node;
            if (!this.isWallNode(node)) continue;
            closest = Math.min(closest, results[i].distance - this.wallBuffer);
            hit = true;
        }

        this._lastHitDistance = closest;
        return hit;
    }

    private isWallNode(node: Node): boolean {
        const tag = this.wallTag.trim().toLowerCase();
        let current: Node | null = node;
        while (current) {
            const objectTag = current.getComponent(ObjectTag);
            if (objectTag && objectTag.tag === ObjectTags.Wall) return true;
            if (!tag) { current = current.parent; continue; }
            const name = current.name.toLowerCase();
            if (name.includes(tag)) return true;
            current = current.parent;
        }
        return false;
    }

    private lerp(start: number, end: number, t: number): number {
        return start * (1 - t) + end * t;
    }
}