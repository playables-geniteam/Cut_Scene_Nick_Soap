import { _decorator, Component, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScaleOnEnable')
export class ScaleOnEnable extends Component {

    @property({ tooltip: 'Duration in seconds to tween from 0 to original scale' })
    duration: number = 1;

    @property({ tooltip: 'Delay in seconds before the scale tween starts' })
    delay: number = 1;

    private _originalScale: Vec3 = new Vec3(1, 1, 1);

    onLoad() {
        this._originalScale = this.node.scale.clone();
    }

    onEnable() {
        this.node.setScale(0, 0, 0);

        tween(this.node)
            .delay(this.delay)
            .to(this.duration, { scale: this._originalScale }, { easing: 'backOut' })
            .start();
    }
}