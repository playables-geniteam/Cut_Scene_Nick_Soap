import { _decorator, Camera, Collider, Component, ICollisionEvent, ITriggerEvent, Label, Node, tween, Vec3, UITransform, find } from 'cc';
import { ObjectTag } from './ObjectTag';
import { MOVEMENT_TYPE, ObjectTags } from './Constants';
import { GameManager } from './GameManager';
import { CharacterMovement } from './CharacterMovement';
import { AnimationManager } from './AnimationManager';
import { SoundManager } from './SoundManager';
const { ccclass, property } = _decorator;

@ccclass('CollisionHandler')
export class CollisionHandler extends Component {

    @property(Node)
    climbUpTrigger: Node = null;

    @property(Node)
    crouchPerson: Node = null;

    @property(Node)
    targetUINode: Node = null;

    @property(Camera)
    mainCamera: Camera = null;

    private alreadyTriggered: boolean = false;
    isMoveable: boolean = true;
    private _collider: Collider = null;

    private tag1CollisionTimer: number = 0;
    private tag1CollisionActive: boolean = false;
    private tag1AnimationPlayed: boolean = false;

    protected onLoad() {
        this._collider = this.getComponent(Collider);
    }

    start() {
        this.EnableListeners();
    }

    update(deltaTime: number) {
        if (this.tag1CollisionActive && !this.tag1AnimationPlayed) {
            this.tag1CollisionTimer += deltaTime;
            if (this.tag1CollisionTimer >= .3) {
                this.tag1AnimationPlayed = true;
            }
        }
    }

    EnableListeners() {
        if (this._collider) {
            this._collider.on('onTriggerEnter', this.onTriggerEnter, this);
            this._collider.on('onTriggerStay', this.onTriggerStay, this);
            this._collider.on('onTriggerExit', this.onTriggerExit, this);
            this._collider.on('onCollisionEnter', this.onCollisionEnter, this);
            this._collider.on('onCollisionStay', this.onCollisionStay, this);
            this._collider.on('onCollisionExit', this.onCollisionExit, this);
        }
    }

    DisableListeners() {
        if (this._collider) {
            this._collider.off('onTriggerEnter', this.onTriggerEnter, this);
            this._collider.off('onTriggerStay', this.onTriggerStay, this);
            this._collider.off('onTriggerExit', this.onTriggerExit, this);
            this._collider.off('onCollisionEnter', this.onCollisionEnter, this);
            this._collider.off('onCollisionStay', this.onCollisionStay, this);
            this._collider.off('onCollisionExit', this.onCollisionExit, this);
        }
    }

    private playMagicalMergeAnimation(collidedNode: Node) {
        if (!this.targetUINode || !this.mainCamera) return;

        const torusNode = collidedNode.getChildByName('Torus');
        if (torusNode) torusNode.active = false;

        const startPos = collidedNode.worldPosition.clone();
        const cameraNode = this.mainCamera.node;
        const cameraPos = cameraNode.worldPosition.clone();

        const cameraRight = new Vec3();
        const cameraUp = new Vec3();
        const cameraForward = new Vec3();
        Vec3.transformQuat(cameraRight, new Vec3(1, 0, 0), cameraNode.worldRotation);
        Vec3.transformQuat(cameraUp, new Vec3(0, 1, 0), cameraNode.worldRotation);
        Vec3.transformQuat(cameraForward, new Vec3(0, 0, -1), cameraNode.worldRotation);

        const uiScreenPos = this.targetUINode.worldPosition;
        const distance = 10;
        const targetPos = new Vec3();
        targetPos.add(cameraPos);
        targetPos.add(cameraForward.multiplyScalar(distance));
        targetPos.add(cameraRight.multiplyScalar(uiScreenPos.x * 0.01));
        targetPos.add(cameraUp.multiplyScalar(uiScreenPos.y * 0.01));

        const midPoint = new Vec3(
            (startPos.x + targetPos.x) / 2,
            Math.max(startPos.y, targetPos.y) + 4,
            (startPos.z + targetPos.z) / 2
        );

        const originalScale = collidedNode.scale.clone();

        this.targetUINode.active = true;
        this.playUIPopAnimation(this.targetUINode);

        tween(collidedNode)
            .to(0.15, { scale: originalScale.clone().multiplyScalar(1.3) }, { easing: 'backOut' })
            .to(0.3, { position: midPoint }, { easing: 'quadOut' })
            .to(0.4, { position: targetPos, scale: new Vec3(0.1, 0.1, 0.1) }, { easing: 'quadIn' })
            .call(() => { collidedNode.active = false; })
            .start();

        tween(collidedNode)
            .to(0.85, { eulerAngles: new Vec3(360, 720, 0) })
            .start();
    }

    private playUIPopAnimation(uiNode: Node) {
        const originalScale = uiNode.scale.clone();
        uiNode.setScale(0, 0, 0);
        tween(uiNode)
            .to(0.2, { scale: originalScale.clone().multiplyScalar(1.3) }, { easing: 'backOut' })
            .to(0.15, { scale: originalScale }, { easing: 'sineOut' })
            .start();
    }

    private handleEnter(otherNode: Node) {
        const objectTagComp = otherNode.getComponent(ObjectTag);
        if (!objectTagComp) return;

        let tag = objectTagComp.tag;

        if (tag == ObjectTags.Tag_1) {
            this.tag1CollisionActive = true;
            this.tag1CollisionTimer = 0;
            this.tag1AnimationPlayed = false;
        }

        if (tag === ObjectTags.Tag_2) {
            const playerScript = GameManager.instance.player.getComponent(CharacterMovement);
            if (playerScript) {
                if (playerScript.mainCamera) {
                    playerScript.mainCamera.node.parent = null;
                }
            }
        }

        if (tag == ObjectTags.SOAP) {
            // Freeze the player and hide the joystick
            const playerScript = GameManager.instance.player.getComponent(CharacterMovement);
            if (playerScript) playerScript.freeze();
            if (GameManager.instance.Joystick) GameManager.instance.Joystick.active = false;

            GameManager.instance.OverlayBG.active = false;
            GameManager.instance.SoapUI.active = true;
            GameManager.instance.SoapUIButton.active = true;
            GameManager.instance.SoapUIText.active = true;
            GameManager.instance.MarkerText.active = false;
            GameManager.instance.SoapTrigger.active = false;
        }

        if (tag === ObjectTags.FINISH) {
            GameManager.instance.soundManagerNode.getComponent(SoundManager).playOneShot(6);
            GameManager.instance.endScreen.active = true;
        }
    }

    private handleStay(otherNode: Node) {
        const objectTagComp = otherNode.getComponent(ObjectTag);
        if (!objectTagComp) return;

        let tag = objectTagComp.tag;

        if (tag == ObjectTags.Tag_1 && this.tag1AnimationPlayed && this.tag1CollisionActive) {
            this.tag1CollisionActive = false;

            const oldValue = GameManager.instance.tag1CollectedCount;
            GameManager.instance.tag1CollectedCount = oldValue + 100;

            console.log(`Tag_1 collected! Total count: ${GameManager.instance.tag1CollectedCount}`);

            this.playMagicalMergeAnimation(otherNode);
        }
    }

    private handleExit(otherNode: Node) {
        const objectTagComp = otherNode.getComponent(ObjectTag);
        if (!objectTagComp) return;

        let otherTag = objectTagComp.tag;

        if (otherTag === ObjectTags.Tag_1) {
            this.tag1CollisionActive = false;
            this.tag1CollisionTimer = 0;
            this.tag1AnimationPlayed = false;
            GameManager.instance.currentMovement = MOVEMENT_TYPE.WALK;
        }
    }

    onTriggerEnter(event: ITriggerEvent) { this.handleEnter(event.otherCollider.node); }
    onTriggerStay(event: ITriggerEvent) { this.handleStay(event.otherCollider.node); }
    onTriggerExit(event: ITriggerEvent) { this.handleExit(event.otherCollider.node); }
    onCollisionEnter(event: ICollisionEvent) { this.handleEnter(event.otherCollider.node); }
    onCollisionStay(event: ICollisionEvent) { this.handleStay(event.otherCollider.node); }
    onCollisionExit(event: ICollisionEvent) { this.handleExit(event.otherCollider.node); }

    protected onDestroy() {
        this.DisableListeners();
    }
}