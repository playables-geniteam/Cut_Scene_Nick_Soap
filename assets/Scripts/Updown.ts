import { _decorator, Component, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Updown')
export class Updown extends Component {

    @property({ tooltip: 'How many units to move up and down from the starting position' })
    amplitude: number = 0.5;

    @property({ tooltip: 'Time in seconds for one full up-down cycle' })
    duration: number = 1.5;

    start() {
        const startPos = this.node.position.clone();
        const upPos = new Vec3(startPos.x, startPos.y + this.amplitude, startPos.z);
        const downPos = new Vec3(startPos.x, startPos.y - this.amplitude, startPos.z);

        tween(this.node)
            .to(this.duration / 2, { position: upPos }, { easing: 'sineInOut' })
            .to(this.duration / 2, { position: downPos }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }

    update(deltaTime: number) { }
}