// import { _decorator, Node, EventTouch, Touch, Component, UITransform, Input, EventKeyboard, KeyCode, v2, Vec3, input, Scene, director, EventMouse, macro, view, screen } from 'cc';
// import { EasyControllerEvent } from './EasyController';
// import { GameManager } from './GameManager';

// const { ccclass, property } = _decorator;

// /****
//  * split screen into three parts.
//  * ---------------------------------------------
//  *                                              |
//  *           1.camera rotation zone             |
//  *                                              |
//  *----------------------------------------------|
//  *                      |                       |
//  * 2.movement ctrl zone  | 3.camera rotation zone|
//  *                      |                       |
//  * ----------------------------------------------
//  * 
//  * multi-touch for camera zoom.
//  *  */

// @ccclass('UI_Joystick')
// export class UI_Joystick extends Component {

//     private static _inst: UI_Joystick = null;
//     public static get inst(): UI_Joystick {
//         return this._inst;
//     }


//     _ctrlRoot: UITransform = null;
//     private _ctrlPointer: Node = null;
//     private _checkerCamera: UITransform = null;
//     private _buttons: Node = null;

//     private _cameraSensitivity: number = 0.1;
//     private _distanceOfTwoTouchPoint: number = 0;

//     public _movementTouch: Touch = null;
//     private _cameraTouchA: Touch = null;
//     private _cameraTouchB: Touch = null;

//     private _scene: Scene = null;

//     private _key2buttonMap = {};

//     originalPos: Vec3 = null

//     // Touch hold timer
//     private _isHoldingTouch: boolean = false;
//     private _touchHoldTimer: number = 0;
//     private _touchHoldInterval: any = null;

//     protected onLoad(): void {
//         UI_Joystick._inst = this;
//     }

//     start() {

//         // ---- CHECKER: CAMERA CONTROL ZONE ----
//         if (!this._checkerCamera) {
//             const camNode = this.node.getChildByName('checker_camera');
//             if (!camNode) {
//                 console.error("❌ Missing node: checker_camera");
//                 return;
//             }
//             this._checkerCamera = camNode.getComponent(UITransform);
//         }

//         this._checkerCamera.node.on(Input.EventType.TOUCH_START, this.onTouchStart_CameraCtrl, this);
//         this._checkerCamera.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove_CameraCtrl, this);
//         this._checkerCamera.node.on(Input.EventType.TOUCH_END, this.onTouchUp_CameraCtrl, this);
//         this._checkerCamera.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchUp_CameraCtrl, this);


//         // ---- CHECKER: MOVEMENT ZONE ----
//         const moveNode = this.node.getChildByName('checker_movement');
//         if (!moveNode) {
//             console.error("❌ Missing node: checker_movement");
//             return;
//         }

//         const checkerMovement = moveNode.getComponent(UITransform);

//         checkerMovement.node.on(Input.EventType.TOUCH_START, this.onTouchStart_Movement, this);
//         checkerMovement.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove_Movement, this);
//         checkerMovement.node.on(Input.EventType.TOUCH_END, this.onTouchUp_Movement, this);
//         checkerMovement.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchUp_Movement, this);


//         // ---- JOYSTICK ROOT ----
//         if (!this._ctrlRoot) {
//             const ctrlNode = this.node.getChildByName('ctrl');
//             if (!ctrlNode) {
//                 console.error("❌ Missing node: ctrl");
//                 return;
//             }
//             this._ctrlRoot = ctrlNode.getComponent(UITransform);
//         }

//         this.originalPos = this._ctrlRoot.node.position.clone();


//         // ---- POINTER ----
//         if (!this._ctrlPointer) {
//             const pointerNode = this._ctrlRoot.node.getChildByName('pointer');
//             if (!pointerNode) {
//                 console.error("❌ Missing node: pointer (child of ctrl)");
//                 return;
//             }
//             this._ctrlPointer = pointerNode;
//         }


//         // // ---- BUTTONS ----
//         // if (!this._buttons) {
//         //     const btnNode = this.node.getChildByName('buttons');
//         //     if (!btnNode) {
//         //         console.warn("⚠️ Missing node: buttons (optional)");
//         //     }
//         //     this._buttons = btnNode;
//         // }


//         // ---- KEY → BUTTON MAP ----
//         this._key2buttonMap[KeyCode.KEY_J] = 'btn_slot_0';
//         this._key2buttonMap[KeyCode.KEY_K] = 'btn_slot_1';
//         this._key2buttonMap[KeyCode.KEY_L] = 'btn_slot_2';
//         this._key2buttonMap[KeyCode.KEY_U] = 'btn_slot_3';
//         this._key2buttonMap[KeyCode.KEY_I] = 'btn_slot_4';


//         // ---- INPUT LISTENERS ----
//         // input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
//         // input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
//         input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);


//         // ---- SCENE REF ----
//         this._scene = director.getScene();

//         console.log("✅ UI_Joystick initialized correctly");
//     }

//     public ForceJoystickRelease() {
//         if (this._movementTouch) {
//             this._scene.emit(EasyControllerEvent.MOVEMENT_STOP);
//             this._movementTouch = null;
//         }

//         if (this._ctrlPointer) {
//             this._ctrlPointer.setPosition(0, 0, 0);
//         }

//         if (this._ctrlRoot) {
//             this._ctrlRoot.node.setPosition(this.originalPos);
//             // Optional: hide the joystick if needed
//             // this._ctrlRoot.node.active = false;
//         }
//     }

//     onDestroy() {
//         input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
//         input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
//         input.off(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);

//         // Clean up timer if it exists
//         if (this._touchHoldInterval) {
//             clearInterval(this._touchHoldInterval);
//             this._touchHoldInterval = null;
//         }

//         UI_Joystick._inst = null;
//     }

//     bindKeyToButton(keyCode: KeyCode, btnName: string) {
//         this._key2buttonMap[keyCode] = btnName;
//     }

//     setButtonVisible(btnName: string, visible: boolean) {
//         let node = this._buttons?.getChildByName(btnName);
//         if (node) {
//             node.active = visible;
//         }
//     }

//     getButtonByName(btnName: string): Node {
//         return this._buttons.getChildByName(btnName);
//     }

//     /**
//      * Start the touch hold timer
//      */
//     private startTouchHoldTimer() {
//         if (this._isHoldingTouch) return; // Already running

//         this._isHoldingTouch = true;
//         this._touchHoldTimer = 0;

//         this._touchHoldInterval = setInterval(() => {
//             this._touchHoldTimer++;
//             console.log(`Touch hold timer: ${this._touchHoldTimer} seconds`);

//             if (this._touchHoldTimer > 10) {
//                 console.error("❌ Touch hold timer has exceeded 10 seconds!");
//                 GameManager.instance.Joystick.active = false;
//                 GameManager.instance.player.active = false;
//                 GameManager.instance.endScreen.active = true;
//             }
//         }, 1000);
//     }

//     /**
//      * Stop and reset the touch hold timer
//      */
//     private stopAndResetTouchHoldTimer() {
//         if (this._touchHoldInterval) {
//             clearInterval(this._touchHoldInterval);
//             this._touchHoldInterval = null;
//         }

//         console.log(`Touch released after ${this._touchHoldTimer} seconds`);
//         this._isHoldingTouch = false;
//         this._touchHoldTimer = 0;
//     }

//     onTouchStart_Movement(event: EventTouch) {
//         // Reset timer on new touch start
//         this.stopAndResetTouchHoldTimer();

//         // if (GameManager.instance.isGameOver) return
//         // if (!GameManager.instance.isGameStarted) return;
//         let touches = event.getTouches();

//         for (let i = 0; i < touches.length; ++i) {
//             let touch = touches[i];
//             let x = touch.getUILocationX();
//             let y = touch.getUILocationY();
//             if (!this._movementTouch) {


//                 let halfWidth = this._checkerCamera.width / 2;
//                 let halfHeight = this._checkerCamera.height / 2;

//                 this._ctrlRoot.node.active = true;
//                 this._ctrlRoot.node.setPosition(x - halfWidth, y - halfHeight, 0);
//                 this._ctrlPointer.setPosition(0, 0, 0);
//                 this._movementTouch = touch;
//             }
//         }
//     }

//     onTouchMove_Movement(event: EventTouch) {
//         // if (!GameManager.instance.isGameStarted) return;
//         let touches = event.getTouches();
//         for (let i = 0; i < touches.length; ++i) {
//             let touch = touches[i];
//             if (this._movementTouch && touch.getID() == this._movementTouch.getID()) {
//                 let halfWidth = this._checkerCamera.width / 2;
//                 let halfHeight = this._checkerCamera.height / 2;
//                 let x = touch.getUILocationX();
//                 let y = touch.getUILocationY();

//                 let pos = this._ctrlRoot.node.position;
//                 let ox = x - halfWidth - pos.x;
//                 let oy = y - halfHeight - pos.y;

//                 let len = Math.sqrt(ox * ox + oy * oy);
//                 if (len <= 0) {
//                     return;
//                 }

//                 let dirX = ox / len;
//                 let dirY = oy / len;
//                 let radius = this._ctrlRoot.width / 2;
//                 if (len > radius) {
//                     len = radius;
//                     ox = dirX * radius;
//                     oy = dirY * radius;
//                 }

//                 this._ctrlPointer.setPosition(ox, oy, 0);

//                 // degree 0 ~ 360 based on x axis.
//                 let degree = Math.atan(dirY / dirX) / Math.PI * 180;
//                 if (dirX < 0) {
//                     degree += 180;
//                 }
//                 else {
//                     degree += 360;
//                 }

//                 this._scene.emit(EasyControllerEvent.MOVEMENT, degree, len / radius);
//             }
//         }
//     }

//     onTouchUp_Movement(event: EventTouch) {
//         // if (!GameManager.instance.isGameStarted) return;
//         let touches = event.getTouches();
//         for (let i = 0; i < touches.length; ++i) {
//             let touch = touches[i];
//             if (this._movementTouch && touch.getID() == this._movementTouch.getID()) {
//                 this._scene.emit(EasyControllerEvent.MOVEMENT_STOP);
//                 this._movementTouch = null;
//                 //   this._ctrlRoot.node.active = false;
//                 this._ctrlPointer.setPosition(0, 0, 0);
//                 this._ctrlRoot.node.setPosition(this.originalPos)

//                 // Start the timer when touch is released
//                 this.startTouchHoldTimer();
//             }
//         }
//     }



//     private getDistOfTwoTouchPoints(): number {
//         let touchA = this._cameraTouchA;
//         let touchB = this._cameraTouchB;
//         if (!touchA || !touchB) {
//             return 0;
//         }
//         let dx = touchA.getLocationX() - touchB.getLocationX();
//         let dy = touchA.getLocationY() - touchB.getLocationY();
//         return Math.sqrt(dx * dx + dy * dy);
//     }

//     private onTouchStart_CameraCtrl(event: EventTouch) {
//         // Reset timer on camera touch start
//         this.stopAndResetTouchHoldTimer();

//         // if (!GameManager.instance.isGameStarted) return;
//         // GameManager.instance.darkerScreen_1.active = false;
//         // GameManager.instance.hand1.active = false;
//         let touches = event.getAllTouches();
//         this._cameraTouchA = null;
//         this._cameraTouchB = null;
//         for (let i = touches.length - 1; i >= 0; i--) {
//             let touch = touches[i];
//             if (this._movementTouch && touch.getID() == this._movementTouch.getID()) {
//                 continue;
//             }
//             if (this._cameraTouchA == null) {
//                 this._cameraTouchA = touches[i];
//             }
//             else if (this._cameraTouchB == null) {
//                 this._cameraTouchB = touches[i];
//                 break;
//             }
//         }
//         this._distanceOfTwoTouchPoint = this.getDistOfTwoTouchPoints();
//     }

//     private onTouchMove_CameraCtrl(event: EventTouch) {
//         // if (!GameManager.instance.isGameStarted) return;
//         let touches = event.getTouches();
//         for (let i = 0; i < touches.length; ++i) {
//             let touch = touches[i];
//             let touchID = touch.getID();
//             //two touches, do camera zoom.
//             if (this._cameraTouchA && this._cameraTouchB) {
//                 console.log(touchID, this._cameraTouchA.getID(), this._cameraTouchB.getID());
//                 let needZoom = false;
//                 if (touchID == this._cameraTouchA.getID()) {
//                     this._cameraTouchA = touch;
//                     needZoom = true;
//                 }
//                 if (touchID == this._cameraTouchB.getID()) {
//                     this._cameraTouchB = touch;
//                     needZoom = true;
//                 }

//                 if (needZoom) {
//                     let newDist = this.getDistOfTwoTouchPoints();
//                     let delta = this._distanceOfTwoTouchPoint - newDist;
//                     this._scene.emit(EasyControllerEvent.CAMERA_ZOOM, delta);
//                     this._distanceOfTwoTouchPoint = newDist;
//                 }
//             }
//             //only one touch, do camera rotate.
//             else if (this._cameraTouchA && touchID == this._cameraTouchA.getID()) {
//                 let dt = touch.getDelta();
//                 let rx = dt.y * this._cameraSensitivity;
//                 let ry = -dt.x * this._cameraSensitivity;
//                 this._scene.emit(EasyControllerEvent.CAMERA_ROTATE, rx, ry);
//             }
//         }
//     }

//     private onTouchUp_CameraCtrl(event: EventTouch) {
//         // if (!GameManager.instance.isGameStarted) return;
//         let touches = event.getAllTouches();
//         let hasTouchA = false;
//         let hasTouchB = false;
//         for (let i = 0; i < touches.length; ++i) {
//             let touch = touches[i];
//             let touchID = touch.getID();
//             if (this._cameraTouchA && touchID == this._cameraTouchA.getID()) {
//                 hasTouchA = true;
//             }
//             else if (this._cameraTouchB && touchID == this._cameraTouchB.getID()) {
//                 hasTouchB = true;
//             }
//         }

//         if (!hasTouchA) {
//             this._cameraTouchA = null;
//         }
//         if (!hasTouchB) {
//             this._cameraTouchB = null;
//         }

//         // Start the timer when camera touch is released
//         if (!hasTouchA && !hasTouchB) {
//             this.startTouchHoldTimer();
//         }
//     }

//     private _keys = [];
//     private _degree: number = 0;

//     onKeyDown(event: EventKeyboard) {
//         let keyCode = event.keyCode;
//         if (keyCode == KeyCode.KEY_A || keyCode == KeyCode.KEY_S || keyCode == KeyCode.KEY_D || keyCode == KeyCode.KEY_W) {
//             if (this._keys.indexOf(keyCode) == -1) {
//                 this._keys.push(keyCode);
//                 this.updateDirection();
//             }
//         }
//         else {
//             let btnName = this._key2buttonMap[keyCode];
//             if (btnName) {
//                 this._scene.emit(EasyControllerEvent.BUTTON, btnName);
//             }
//         }
//     }

//     onKeyUp(event: EventKeyboard) {
//         let keyCode = event.keyCode;
//         if (keyCode == KeyCode.KEY_A || keyCode == KeyCode.KEY_S || keyCode == KeyCode.KEY_D || keyCode == KeyCode.KEY_W) {
//             let index = this._keys.indexOf(keyCode);
//             if (index != -1) {
//                 this._keys.splice(index, 1);
//                 this.updateDirection();
//             }
//         }
//     }

//     onMouseWheel(event: EventMouse) {
//         let delta = event.getScrollY() * 0.1;
//         console.log(delta);
//         this._scene.emit(EasyControllerEvent.CAMERA_ZOOM, delta);
//     }

//     onButtonSlot(event) {
//         let btnName = event.target.name;
//         this._scene.emit(EasyControllerEvent.BUTTON, btnName);
//     }

//     private _key2dirMap = null;

//     updateDirection() {
//         if (this._key2dirMap == null) {
//             this._key2dirMap = {};
//             this._key2dirMap[0] = -1;
//             this._key2dirMap[KeyCode.KEY_A] = 180;
//             this._key2dirMap[KeyCode.KEY_D] = 0;
//             this._key2dirMap[KeyCode.KEY_W] = 90;
//             this._key2dirMap[KeyCode.KEY_S] = 270;

//             this._key2dirMap[KeyCode.KEY_A * 1000 + KeyCode.KEY_W] = this._key2dirMap[KeyCode.KEY_W * 1000 + KeyCode.KEY_A] = 135;
//             this._key2dirMap[KeyCode.KEY_D * 1000 + KeyCode.KEY_W] = this._key2dirMap[KeyCode.KEY_W * 1000 + KeyCode.KEY_D] = 45;
//             this._key2dirMap[KeyCode.KEY_A * 1000 + KeyCode.KEY_S] = this._key2dirMap[KeyCode.KEY_S * 1000 + KeyCode.KEY_A] = 225;
//             this._key2dirMap[KeyCode.KEY_D * 1000 + KeyCode.KEY_S] = this._key2dirMap[KeyCode.KEY_S * 1000 + KeyCode.KEY_D] = 315;

//             this._key2dirMap[KeyCode.KEY_A * 1000 + KeyCode.KEY_D] = this._key2dirMap[KeyCode.KEY_D];
//             this._key2dirMap[KeyCode.KEY_D * 1000 + KeyCode.KEY_A] = this._key2dirMap[KeyCode.KEY_A];
//             this._key2dirMap[KeyCode.KEY_W * 1000 + KeyCode.KEY_S] = this._key2dirMap[KeyCode.KEY_S];
//             this._key2dirMap[KeyCode.KEY_S * 1000 + KeyCode.KEY_W] = this._key2dirMap[KeyCode.KEY_W];
//         }
//         let keyCode0 = this._keys[this._keys.length - 1] || 0;
//         let keyCode1 = this._keys[this._keys.length - 2] || 0;
//         this._degree = this._key2dirMap[keyCode1 * 1000 + keyCode0];
//         if (this._degree == null || this._degree < 0) {
//             this._scene.emit(EasyControllerEvent.MOVEMENT_STOP);
//         }
//         else {
//             this._scene.emit(EasyControllerEvent.MOVEMENT, this._degree, 1.0);
//         }
//     }
// }
import { _decorator, Node, EventTouch, Touch, Component, UITransform, Input, EventKeyboard, KeyCode, v2, Vec3, input, Scene, director, EventMouse, macro, view, screen } from 'cc';
import { EasyControllerEvent } from './EasyController';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

/****
 * split screen into three parts.
 * ---------------------------------------------
 *                                              |
 *           1.camera rotation zone             |
 *                                              |
 *----------------------------------------------|
 *                      |                       |
 * 2.movement ctrl zone  | 3.camera rotation zone|
 *                      |                       |
 * ----------------------------------------------
 * 
 * multi-touch for camera zoom.
 *  */

@ccclass('UI_Joystick')
export class UI_Joystick extends Component {
    @property
    debugMovement: boolean = false;

    @property
    debugLogIntervalSec: number = 0.12;

    private static _inst: UI_Joystick = null;
    public static get inst(): UI_Joystick {
        return this._inst;
    }


    _ctrlRoot: UITransform = null;
    private _ctrlPointer: Node = null;
    private _checkerCamera: UITransform = null;
    private _buttons: Node = null;

    private _cameraSensitivity: number = 0.1;
    private _distanceOfTwoTouchPoint: number = 0;

    private _movementTouch: Touch = null;
    private _cameraTouchA: Touch = null;
    private _cameraTouchB: Touch = null;

    private _scene: Scene = null;
    private _tmpTouchLocal: Vec3 = new Vec3();
    private _firstTouchTimerTriggered: boolean = false;

    private _key2buttonMap = {};
    private _nextMovementDebugTimeSec: number = 0;

    originalPos: Vec3 = null

    protected onLoad(): void {
        UI_Joystick._inst = this;
    }

    start() {

        // ---- CHECKER: CAMERA CONTROL ZONE ----
        if (!this._checkerCamera) {
            const camNode = this.node.getChildByName('checker_camera');
            if (!camNode) {
                console.error("❌ Missing node: checker_camera");
                return;
            }
            this._checkerCamera = camNode.getComponent(UITransform);
        }

        this._checkerCamera.node.on(Input.EventType.TOUCH_START, this.onTouchStart_CameraCtrl, this);
        this._checkerCamera.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove_CameraCtrl, this);
        this._checkerCamera.node.on(Input.EventType.TOUCH_END, this.onTouchUp_CameraCtrl, this);
        this._checkerCamera.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchUp_CameraCtrl, this);


        // ---- CHECKER: MOVEMENT ZONE ----
        const moveNode = this.node.getChildByName('checker_movement');
        if (!moveNode) {
            console.error("❌ Missing node: checker_movement");
            return;
        }

        const checkerMovement = moveNode.getComponent(UITransform);

        checkerMovement.node.on(Input.EventType.TOUCH_START, this.onTouchStart_Movement, this);
        checkerMovement.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove_Movement, this);
        checkerMovement.node.on(Input.EventType.TOUCH_END, this.onTouchUp_Movement, this);
        checkerMovement.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchUp_Movement, this);


        // ---- JOYSTICK ROOT ----
        if (!this._ctrlRoot) {
            const ctrlNode = this.node.getChildByName('ctrl');
            if (!ctrlNode) {
                console.error("❌ Missing node: ctrl");
                return;
            }
            this._ctrlRoot = ctrlNode.getComponent(UITransform);
        }

        this.originalPos = this._ctrlRoot.node.position.clone();


        // ---- POINTER ----
        if (!this._ctrlPointer) {
            const pointerNode = this._ctrlRoot.node.getChildByName('pointer');
            if (!pointerNode) {
                console.error("❌ Missing node: pointer (child of ctrl)");
                return;
            }
            this._ctrlPointer = pointerNode;
        }


        // ---- BUTTONS ----
        if (!this._buttons) {
            const btnNode = this.node.getChildByName('buttons');
            if (!btnNode) {
                console.warn("⚠️ Missing node: buttons (optional)");
            }
            this._buttons = btnNode;
        }


        // ---- KEY → BUTTON MAP ----
        this._key2buttonMap[KeyCode.KEY_J] = 'btn_slot_0';
        this._key2buttonMap[KeyCode.KEY_K] = 'btn_slot_1';
        this._key2buttonMap[KeyCode.KEY_L] = 'btn_slot_2';
        this._key2buttonMap[KeyCode.KEY_U] = 'btn_slot_3';
        this._key2buttonMap[KeyCode.KEY_I] = 'btn_slot_4';


        // ---- INPUT LISTENERS ----
        // input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        // input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);


        // ---- SCENE REF ----
        this._scene = director.getScene();

        console.log("✅ UI_Joystick initialized correctly");
    }

    public ForceJoystickRelease() {
        if (this._movementTouch) {
            this._scene.emit(EasyControllerEvent.MOVEMENT_STOP);
            this._movementTouch = null;
        }

        if (this._ctrlPointer) {
            this._ctrlPointer.setPosition(0, 0, 0);
        }

        if (this._ctrlRoot) {
            this._ctrlRoot.node.setPosition(this.originalPos);
        }
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.off(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);

        UI_Joystick._inst = null;
    }

    bindKeyToButton(keyCode: KeyCode, btnName: string) {
        this._key2buttonMap[keyCode] = btnName;
    }

    setButtonVisible(btnName: string, visible: boolean) {
        let node = this._buttons?.getChildByName(btnName);
        if (node) {
            node.active = visible;
        }
    }

    getButtonByName(btnName: string): Node {
        return this._buttons.getChildByName(btnName);
    }

    onTouchStart_Movement(event: EventTouch) {
        this.startFirstTouchTimerIfNeeded();
        let touches = event.getTouches();
        GameManager.instance.darkerScreen_1.active = false;
        GameManager.instance.hand.active = false;
        for (let i = 0; i < touches.length; ++i) {
            let touch = touches[i];
            let x = touch.getUILocationX();
            let y = touch.getUILocationY();
            if (!this._movementTouch) {
                this.uiToCtrlParentLocal(x, y, this._tmpTouchLocal);
                this._ctrlRoot.node.active = true;
                this._ctrlRoot.node.setPosition(this._tmpTouchLocal.x, this._tmpTouchLocal.y, 0);
                this._ctrlPointer.setPosition(0, 0, 0);
                this._movementTouch = touch;

                if (this.shouldLogMovementDebug()) {
                    console.log(
                        `[JOY][START] touchId=${touch.getID()} ui=(${x.toFixed(1)}, ${y.toFixed(1)}) root=(${this._ctrlRoot.node.position.x.toFixed(1)}, ${this._ctrlRoot.node.position.y.toFixed(1)})`
                    );
                }
            }
        }
    }

    onTouchMove_Movement(event: EventTouch) {
        let touches = event.getTouches();
        for (let i = 0; i < touches.length; ++i) {
            let touch = touches[i];
            if (this._movementTouch && touch.getID() == this._movementTouch.getID()) {
                let x = touch.getUILocationX();
                let y = touch.getUILocationY();
                this.uiToCtrlParentLocal(x, y, this._tmpTouchLocal);

                let pos = this._ctrlRoot.node.position;
                let ox = this._tmpTouchLocal.x - pos.x;
                let oy = this._tmpTouchLocal.y - pos.y;

                let len = Math.sqrt(ox * ox + oy * oy);
                if (len <= 0) {
                    return;
                }

                let dirX = ox / len;
                let dirY = oy / len;
                let radius = this._ctrlRoot.width / 2;
                if (len > radius) {
                    len = radius;
                    ox = dirX * radius;
                    oy = dirY * radius;
                }

                this._ctrlPointer.setPosition(ox, oy, 0);

                // degree 0 ~ 360 based on x axis.
                let degree = Math.atan2(dirY, dirX) / Math.PI * 180;
                if (degree < 0) {
                    degree += 360;
                }

                const strength = len / radius;
                this._scene.emit(EasyControllerEvent.MOVEMENT, degree, strength);

                if (this.shouldLogMovementDebug()) {
                    console.log(
                        `[JOY][MOVE] touchId=${touch.getID()} raw=(${ox.toFixed(2)}, ${oy.toFixed(2)}) dir=(${dirX.toFixed(3)}, ${dirY.toFixed(3)}) deg=${degree.toFixed(1)} strength=${strength.toFixed(3)}`
                    );
                }
            }
        }
    }

    onTouchUp_Movement(event: EventTouch) {
        let touches = event.getTouches();
        for (let i = 0; i < touches.length; ++i) {
            let touch = touches[i];
            if (this._movementTouch && touch.getID() == this._movementTouch.getID()) {
                this._scene.emit(EasyControllerEvent.MOVEMENT_STOP);
                this._movementTouch = null;
                this._ctrlPointer.setPosition(0, 0, 0);
                this._ctrlRoot.node.setPosition(this.originalPos);

                if (this.debugMovement) {
                    console.log(`[JOY][END] touchId=${touch.getID()} reset pointer/root`);
                }
            }
        }
    }

    private shouldLogMovementDebug(): boolean {
        if (!this.debugMovement) return false;
        const nowSec = Date.now() * 0.001;
        if (nowSec < this._nextMovementDebugTimeSec) return false;
        this._nextMovementDebugTimeSec = nowSec + Math.max(0.01, this.debugLogIntervalSec);
        return true;
    }

    private uiToCtrlParentLocal(x: number, y: number, out: Vec3): Vec3 {
        const parent = this._ctrlRoot?.node.parent;
        const parentTransform = parent?.getComponent(UITransform);
        if (!parentTransform) {
            out.set(x, y, 0);
            return out;
        }
        return parentTransform.convertToNodeSpaceAR(new Vec3(x, y, 0), out);
    }

    private getDistOfTwoTouchPoints(): number {
        let touchA = this._cameraTouchA;
        let touchB = this._cameraTouchB;
        if (!touchA || !touchB) {
            return 0;
        }
        let dx = touchA.getLocationX() - touchB.getLocationX();
        let dy = touchA.getLocationY() - touchB.getLocationY();
        return Math.sqrt(dx * dx + dy * dy);
    }

    private onTouchStart_CameraCtrl(event: EventTouch) {
        this.startFirstTouchTimerIfNeeded();
        let touches = event.getAllTouches();
        this._cameraTouchA = null;
        this._cameraTouchB = null;
        for (let i = touches.length - 1; i >= 0; i--) {
            let touch = touches[i];
            if (this._movementTouch && touch.getID() == this._movementTouch.getID()) {
                continue;
            }
            if (this._cameraTouchA == null) {
                this._cameraTouchA = touches[i];
            }
            else if (this._cameraTouchB == null) {
                this._cameraTouchB = touches[i];
                break;
            }
        }
        this._distanceOfTwoTouchPoint = this.getDistOfTwoTouchPoints();
    }

    private startFirstTouchTimerIfNeeded() {
        if (this._firstTouchTimerTriggered) return;
        this._firstTouchTimerTriggered = true;
        // GameManager.instance?.StartFirstTouchTimer(30); // turn for timer to 30 seconds on first touch
    }

    private onTouchMove_CameraCtrl(event: EventTouch) {
        let touches = event.getTouches();
        for (let i = 0; i < touches.length; ++i) {
            let touch = touches[i];
            let touchID = touch.getID();
            // two touches: camera zoom
            if (this._cameraTouchA && this._cameraTouchB) {
                console.log(touchID, this._cameraTouchA.getID(), this._cameraTouchB.getID());
                let needZoom = false;
                if (touchID == this._cameraTouchA.getID()) {
                    this._cameraTouchA = touch;
                    needZoom = true;
                }
                if (touchID == this._cameraTouchB.getID()) {
                    this._cameraTouchB = touch;
                    needZoom = true;
                }

                if (needZoom) {
                    let newDist = this.getDistOfTwoTouchPoints();
                    let delta = this._distanceOfTwoTouchPoint - newDist;
                    this._scene.emit(EasyControllerEvent.CAMERA_ZOOM, delta);
                    this._distanceOfTwoTouchPoint = newDist;
                }
            }
            // one touch: camera rotate
            else if (this._cameraTouchA && touchID == this._cameraTouchA.getID()) {
                let dt = touch.getDelta();
                let rx = dt.y * this._cameraSensitivity;
                let ry = -dt.x * this._cameraSensitivity;
                this._scene.emit(EasyControllerEvent.CAMERA_ROTATE, rx, ry);
            }
        }
    }

    private onTouchUp_CameraCtrl(event: EventTouch) {
        let touches = event.getAllTouches();
        let hasTouchA = false;
        let hasTouchB = false;
        for (let i = 0; i < touches.length; ++i) {
            let touch = touches[i];
            let touchID = touch.getID();
            if (this._cameraTouchA && touchID == this._cameraTouchA.getID()) {
                hasTouchA = true;
            }
            else if (this._cameraTouchB && touchID == this._cameraTouchB.getID()) {
                hasTouchB = true;
            }
        }

        if (!hasTouchA) {
            this._cameraTouchA = null;
        }
        if (!hasTouchB) {
            this._cameraTouchB = null;
        }
    }

    private _keys = [];
    private _degree: number = 0;

    onKeyDown(event: EventKeyboard) {
        let keyCode = event.keyCode;
        if (keyCode == KeyCode.KEY_A || keyCode == KeyCode.KEY_S || keyCode == KeyCode.KEY_D || keyCode == KeyCode.KEY_W) {
            if (this._keys.indexOf(keyCode) == -1) {
                this._keys.push(keyCode);
                this.updateDirection();
            }
        }
        else {
            let btnName = this._key2buttonMap[keyCode];
            if (btnName) {
                this._scene.emit(EasyControllerEvent.BUTTON, btnName);
            }
        }
    }

    onKeyUp(event: EventKeyboard) {
        let keyCode = event.keyCode;
        if (keyCode == KeyCode.KEY_A || keyCode == KeyCode.KEY_S || keyCode == KeyCode.KEY_D || keyCode == KeyCode.KEY_W) {
            let index = this._keys.indexOf(keyCode);
            if (index != -1) {
                this._keys.splice(index, 1);
                this.updateDirection();
            }
        }
    }

    onMouseWheel(event: EventMouse) {
        let delta = event.getScrollY() * 0.1;
        console.log(delta);
        this._scene.emit(EasyControllerEvent.CAMERA_ZOOM, delta);
    }

    onButtonSlot(event) {
        let btnName = event.target.name;
        this._scene.emit(EasyControllerEvent.BUTTON, btnName);
    }

    private _key2dirMap = null;

    updateDirection() {
        if (this._key2dirMap == null) {
            this._key2dirMap = {};
            this._key2dirMap[0] = -1;
            this._key2dirMap[KeyCode.KEY_A] = 180;
            this._key2dirMap[KeyCode.KEY_D] = 0;
            this._key2dirMap[KeyCode.KEY_W] = 90;
            this._key2dirMap[KeyCode.KEY_S] = 270;

            this._key2dirMap[KeyCode.KEY_A * 1000 + KeyCode.KEY_W] = this._key2dirMap[KeyCode.KEY_W * 1000 + KeyCode.KEY_A] = 135;
            this._key2dirMap[KeyCode.KEY_D * 1000 + KeyCode.KEY_W] = this._key2dirMap[KeyCode.KEY_W * 1000 + KeyCode.KEY_D] = 45;
            this._key2dirMap[KeyCode.KEY_A * 1000 + KeyCode.KEY_S] = this._key2dirMap[KeyCode.KEY_S * 1000 + KeyCode.KEY_A] = 225;
            this._key2dirMap[KeyCode.KEY_D * 1000 + KeyCode.KEY_S] = this._key2dirMap[KeyCode.KEY_S * 1000 + KeyCode.KEY_D] = 315;

            this._key2dirMap[KeyCode.KEY_A * 1000 + KeyCode.KEY_D] = this._key2dirMap[KeyCode.KEY_D];
            this._key2dirMap[KeyCode.KEY_D * 1000 + KeyCode.KEY_A] = this._key2dirMap[KeyCode.KEY_A];
            this._key2dirMap[KeyCode.KEY_W * 1000 + KeyCode.KEY_S] = this._key2dirMap[KeyCode.KEY_S];
            this._key2dirMap[KeyCode.KEY_S * 1000 + KeyCode.KEY_W] = this._key2dirMap[KeyCode.KEY_W];
        }
        let keyCode0 = this._keys[this._keys.length - 1] || 0;
        let keyCode1 = this._keys[this._keys.length - 2] || 0;
        this._degree = this._key2dirMap[keyCode1 * 1000 + keyCode0];
        if (this._degree == null || this._degree < 0) {
            this._scene.emit(EasyControllerEvent.MOVEMENT_STOP);
        }
        else {
            this._scene.emit(EasyControllerEvent.MOVEMENT, this._degree, 1.0);
        }
    }
}