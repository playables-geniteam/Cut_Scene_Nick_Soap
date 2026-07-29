import { _decorator, Component, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIBounce')
export class UIBounce extends Component {

    @property
    bounceScale: number = 1.15;  // how big it grows

    @property
    duration: number = 0.2;      // speed of the bounce

    start() {

        const originalScale = this.node.scale.clone();
        const biggerScale = new Vec3(
            originalScale.x * this.bounceScale,
            originalScale.y * this.bounceScale,
            originalScale.z * this.bounceScale
        );

        tween(this.node)
            .to(this.duration, { scale: biggerScale }, { easing: 'sineOut' })
            .to(this.duration, { scale: originalScale }, { easing: 'sineIn' })
            .union()
            .repeatForever()
            .start();
    }
}
