import { _decorator, Component, Node, tween, Tween, Vec3, math } from 'cc';
import { Animator } from './Animator';
import { GameManager } from './GameManager';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

type Proxy = {
    px: number; py: number; pz: number;
    t: number;
};

@ccclass('ObjectsMover')
export class ObjectsMover extends Component {
    @property({ tooltip: 'Use different speed for first N waypoints' })
public useDifferentSpeedForFirstPoints: boolean = false;

@property({ tooltip: 'Duration for first N waypoints' })
public firstPointsDuration: number = 1;

@property({ tooltip: 'Apply different speed for first N waypoints' })
public firstPointsCount: number = 2;

    @property({ type: [Node], tooltip: 'Waypoint nodes the target will travel through' })
    public waypoints: Node[] = [];

    @property({ type: Node, tooltip: 'The node that will be moved' })
    public target: Node | null = null;

    @property({ tooltip: 'Total duration in seconds for the full path' })
    public duration: number = 3;

    @property({ tooltip: 'Loop back to the first waypoint after reaching the last' })
    public isLoop: boolean = false;

    @property({ tooltip: 'If true, calls onPathComplete() when all waypoints are finished' })
    public notifyOnComplete: boolean = false;

    @property({ tooltip: 'If true, onPathComplete fires the end sound sequence in GameManager' })
    public triggerEndSoundOnComplete: boolean = false;

    @property({ tooltip: 'If true, this is the last mover in the sequence — enables debug logging' })
    public isLastMover: boolean = false;

    private _activeTween: Tween<Proxy> | null = null;

    private _log(msg: string): void {
        if (this.isLastMover) console.log(`[ObjectsMover] ${msg}`);
    }

    // ─────────────────────────────────────────────────────────────────
    protected start(): void {
        this.startMoving();
    }
    protected onEnable(): void {
    this.snapToFirstWaypoint();
}

private snapToFirstWaypoint(): void {
    if (!this.target || this.waypoints.length === 0) {
        return;
    }

    this.target.setWorldPosition(this.waypoints[0].worldPosition);
    this.target.setWorldRotation(this.waypoints[0].worldRotation);
}

    protected onDestroy(): void {
        this.stop();
    }

    // ─────────────────────────────────────────────────────────────────
    public startMoving(): void {
        if (this.target) {
            this.moveThrough(this.waypoints, this.target, this.duration);
        }
    }

    public startMovingFromCurrentPosition(): void {
        if (!this.target || this.waypoints.length === 0) {
            console.warn('ObjectsMover: target or waypoints are missing.');
            return;
        }

        this.stop();

        // Slice from waypoint 1 onward for the path
        const waypointsToUse = this.waypoints.length > 1
            ? this.waypoints.slice(1)
            : this.waypoints;

        // Calculate speed based only on the waypoints actually being traveled
        // so speed is consistent with the real remaining path length
        const speed = this._calcSpeed(this.target, waypointsToUse, this.duration);
        this._activeTween = this._buildChain(this.target, waypointsToUse, speed, this.isLoop);
        this._activeTween.start();
    }

    public moveThrough(waypoints: Node[], target: Node, duration: number): void {
        if (!target || waypoints.length === 0) {
            console.warn('ObjectsMover: target or waypoints are missing.');
            return;
        }

        this.stop();

        const speed = this._calcSpeed(target, waypoints, duration);
        this._activeTween = this._buildChain(target, waypoints, speed, this.isLoop);
        this._activeTween.start();
    }

    public stop(): void {
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }
    }

    public onPathComplete(): void {
        if (GameManager.instance?.isGameOver) {
            this._log(`Game already over — ignoring path complete on "${this.node.name}"`);
            return;
        }

        this._log(`onPathComplete fired on "${this.node.name}"`);

        // Enable Particle2 after 0.3s, disable it after 1s
        setTimeout(() => {
            if (GameManager.instance?.isGameOver) {
                return;
            }
            if (GameManager.instance?.Particle2) {
                GameManager.instance.Particle2.active = true;
                setTimeout(() => {
                    if (!GameManager.instance?.isGameOver) {
                        GameManager.instance.Particle2.active = false;
                    }
                }, 1000);
            }
        }, 300);

        if (this.notifyOnComplete && !this.isLastMover) {
            this._log('notifyOnComplete → firing end sound sequence + animator');
            GameManager.instance?.playEndSoundSequence();
            this.getComponent(Animator)?.playSequenceFrom(1);
        }

        if (this.triggerEndSoundOnComplete) {
            this._log('triggerEndSoundOnComplete → firing end sound sequence');
            GameManager.instance?.playEndSoundSequence();
        }

        if (this.isLastMover && this.notifyOnComplete) {
            this._log('isLastMover + notifyOnComplete both true → showing end screen');
            GameManager.instance.MissT_1.active = false;
            GameManager.instance.Character2.active = false;
            GameManager.instance?.showEndScreen();
        }
    }

    // ─────────────────────────────────────────────────────────────────
    private _calcSpeed(target: Node, waypoints: Node[], duration: number): number {
        let totalDistance = 0;
        totalDistance += Vec3.distance(target.worldPosition, waypoints[0].worldPosition);
        for (let i = 1; i < waypoints.length; i++) {
            totalDistance += Vec3.distance(waypoints[i - 1].worldPosition, waypoints[i].worldPosition);
        }
        if (totalDistance === 0) return 1;
        return totalDistance / duration;
    }

    private _buildChain(
        target: Node,
        waypoints: Node[],
        speed: number,
        loop: boolean,
    ): Tween<Proxy> {

        

        const proxy: Proxy = {
            px: target.worldPosition.x,
            py: target.worldPosition.y,
            pz: target.worldPosition.z,
            t: 0,
        };

        const startPos = target.worldPosition.clone();
        const startRot = target.worldRotation.clone();

        const _pos = new Vec3();
        const _quat = new math.Quat();

        const last = waypoints.length - 1;
        let chain = tween(proxy);
        let prevPos = target.worldPosition.clone();

        for (let i = 0; i <= last; i++) {
            const wp = waypoints[i];
            const dp = wp.worldPosition.clone();

            const segmentStart = i === 0 ? startPos.clone() : prevPos.clone();
            const segmentDistance = Vec3.distance(segmentStart, dp);
            const segmentDuration = segmentDistance / speed;
            prevPos = dp.clone();

            // fromQuat: use the previous waypoint's rotation for i>0
            // so every segment interpolates between the two waypoint rotations,
            // not from whatever the target happens to be facing at build time.
            const fromQuat = i === 0
                ? startRot.clone()
                : waypoints[i - 1].worldRotation.clone();
            const toQuat = wp.worldRotation.clone();

            const easing = loop ? 'linear'
                : i === 0 && last === 0 ? 'smooth'
                    : i === 0 ? 'quadIn'
                        : i === last ? 'quadOut'
                            : 'linear';

            if (this.notifyOnComplete && !loop && i === 3) {
                chain = chain.call(() => {
                    this._log('Reached waypoint index 3 — scheduling loop swap in 1s');
                    setTimeout(() => {
                        if (!GameManager.instance?.isGameOver) {
                            GameManager.instance?.stopAndSwapToLoop1();
                        }
                    }, 1000);
                });
            }

            // Capture fromQuat and toQuat per-segment so the closure holds the right values
            const _fromQuat = fromQuat.clone();
            const _toQuat = toQuat.clone();

            chain = chain
                .call(() => {
                    proxy.t = 0;
                    this._log(`Starting segment to waypoint index ${i}`);
                })
                .to(
                    segmentDuration,
                    { px: dp.x, py: dp.y, pz: dp.z, t: 1 },
                    {
                        easing,
                        onUpdate: (p: Proxy) => {
                            _pos.set(p.px, p.py, p.pz);
                            target.setWorldPosition(_pos);
                            math.Quat.slerp(_quat, _fromQuat, _toQuat, p.t);
                            target.setWorldRotation(_quat);
                        },
                    },
                );
        }

        if (loop) {
            const origin = waypoints[0];
            const op = origin.worldPosition.clone();
            const or_ = origin.worldRotation.clone();

            chain = chain.call(() => {
                proxy.px = op.x; proxy.py = op.y; proxy.pz = op.z; proxy.t = 0;
                target.setWorldPosition(op);
                target.setWorldRotation(or_);
            });

            return tween(proxy).sequence(chain).repeatForever();
        }

        if (this.notifyOnComplete || this.triggerEndSoundOnComplete) {
            chain = chain.call(() => { this.onPathComplete(); });
        }

        return chain;
    }
}