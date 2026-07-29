import { _decorator, Component, Node, tween, Vec3, Input, input, EventKeyboard, KeyCode } from 'cc';
import { GameManager } from './GameManager';
import { SoundManager } from './SoundManager';
const { ccclass, property } = _decorator;

@ccclass('AnimationManager')
export class AnimationManager extends Component {
    @property({ type: [Node], tooltip: 'Array of nodes to manage animations' })
    nodes: Node[] = [];

    @property({ type: [Node], tooltip: 'Array of nodes to cycle through' })
    cycleNodes: Node[] = [];

    @property({ type: [Node], tooltip: 'Mirror array — activates in sync with cycleNodes' })
    mirrorCycleNodes: Node[] = [];

    public currentCycleIndex: number = 0;

    start() {
        // Initialize - disable all nodes at start
        this.nodes.forEach((node, index) => {
            if (node) {
                node.active = false;
                console.log(`Node ${index}: ${node.name} - Initially disabled`);
            }
        });

        // Initialize cycle nodes - only first one active
        this.cycleNodes.forEach((node, index) => {
            if (node) {
                node.active = index === 0; // Only first node is active
                console.log(`Cycle Node ${index}: ${node.name} - ${index === 0 ? 'Active' : 'Disabled'}`);
            }
        });

        // Initialize mirror cycle nodes - only first one active
        this.mirrorCycleNodes.forEach((node, index) => {
            if (node) {
                node.active = index === 0; // Only first node is active
                console.log(`Mirror Cycle Node ${index}: ${node.name} - ${index === 0 ? 'Active' : 'Disabled'}`);
            }
        });
    }

    update(deltaTime: number) {
        // Your animation update logic here
    }

    /**
     * Cycle through nodes - disable all except the one at current index
     * Index increments with each call
     * Sets the current cycle node as the target for arrow to look at
     */
    public cycleToNextNode() {
        if (this.cycleNodes.length === 0) {
            console.warn('No cycle nodes available');
            return;
        }

        // Increment index (wrap around if at end)
        this.currentCycleIndex = (this.currentCycleIndex + 1) % this.cycleNodes.length;

        // Disable all cycle nodes except the current index
        this.cycleNodes.forEach((node, index) => {
            if (node) {
                node.active = index === this.currentCycleIndex;
            }
        });

        // Disable all mirror cycle nodes except the current index (synced with cycleNodes)
        this.mirrorCycleNodes.forEach((node, index) => {
            if (node) {
                const shouldBeActive = index === this.currentCycleIndex;
                node.active = shouldBeActive;
                if (shouldBeActive) {
                    node.setScale(0, 0, 0);
                    tween(node)
                        .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                        .start();
                }
            }
        });

        // Debug logging for cycle nodes
        if (this.currentCycleIndex === 0) {
            console.log("Debug: At cycle index 0");
            if (this.cycleNodes.length > 0 && this.cycleNodes[0]) {
                console.log("Hehe 0 - Node:", this.cycleNodes[0].name);
            }
        } else if (this.currentCycleIndex === 1) {
            console.log("Debug: At cycle index 1");
            if (this.cycleNodes.length > 1 && this.cycleNodes[1]) {
                console.log("Hehe 1 - Node:", this.cycleNodes[1].name);
            }
        } else if (this.currentCycleIndex === 2) {
            console.log("Debug: At cycle index 2");
            if (this.cycleNodes.length > 2 && this.cycleNodes[2]) {
                console.log("Hehe 2 - Node:", this.cycleNodes[2].name);
            }
        } else if (this.currentCycleIndex === 3) {
            console.log("Debug: At cycle index 3");
            if (this.cycleNodes.length > 3 && this.cycleNodes[3]) {
                console.log("Hehe 3 - Node:", this.cycleNodes[3].name);
            }
        } else if (this.currentCycleIndex === 4) {
            console.log("Debug: At cycle index 4");
            if (this.cycleNodes.length > 4 && this.cycleNodes[4]) {
                console.log("Hehe 4 - Node:", this.cycleNodes[4].name);
            }
        } else if (this.currentCycleIndex === 5) {
            console.log("Debug: At cycle index 5");
            if (this.cycleNodes.length > 5 && this.cycleNodes[5]) {
                // GameManager.instance.GameDownloadEvent();
                console.log("Hehe 5 - Node:", this.cycleNodes[5].name);
            }
        }

        console.log(`Cycled to node at index ${this.currentCycleIndex}: ${this.cycleNodes[this.currentCycleIndex]?.name}`);
    }

    /**
     * Enable and animate a node at the given index
     * @param index - The index of the node to enable (0-based)
     */
    public enableNodeAtIndex(index: number) {
        // Check if index is valid
        if (index < 0 || index >= this.nodes.length) {
            console.error(`Invalid index: ${index}. Array has ${this.nodes.length} nodes.`);
            return;
        }

        const node = this.nodes[index];
        if (!node) {
            console.error(`Node at index ${index} is null or undefined.`);
            return;
        }

        // Enable the node
        node.active = true;
        this?.cycleToNextNode();


        SoundManager.instance.playOneShot(0, .6);
        // Pick a random animation variation
        const animationType = Math.floor(Math.random() * 5);
        SoundManager.instance.playOneShot(2, .3);

        switch (animationType) {
            case 0:
                this.playPopAnimation(node);
                break;
            case 1:
                this.playSpinPopAnimation(node);
                break;
            case 2:
                this.playElasticAnimation(node);
                break;
            case 3:
                this.playDropBounceAnimation(node);
                break;
            case 4:
                this.playWobbleAnimation(node);
                break;
        }

        console.log(`Enabled node at index ${index}: ${node.name} with animation ${animationType}`);

        // Check if this is the last element
        if (index === this.nodes.length - 1) {
            console.log("Last element enabled! Triggering end screen in 1 second...");
            this.scheduleOnce(() => {
                // GameManager.instance.GameEndEvent(0);
                // SoundManager.instance.playOneShot(1, .6);
                // GameManager.instance.hudScreen.active = false;
                // GameManager.instance.Joystick.active = false;
                // GameManager.instance.player.active = false;
                GameManager.instance.endScreen.active = true;
                GameManager.instance.GameDownloadEvent();
            }, 1);
        }
    }

    /**
     * Animation 1: Classic pop with bounce
     */
    private playPopAnimation(node: Node) {
        const originalScale = node.scale.clone();
        node.setScale(0, 0, 0);

        tween(node)
            .to(0.25, { scale: originalScale.clone().multiplyScalar(1.4) }, { easing: 'backOut' })
            .to(0.15, { scale: originalScale.clone().multiplyScalar(0.9) }, { easing: 'quadOut' })
            .to(0.1, { scale: originalScale }, { easing: 'quadOut' })
            .start();
    }

    /**
     * Animation 2: Pop with spin
     */
    private playSpinPopAnimation(node: Node) {
        const originalScale = node.scale.clone();
        const originalRotation = node.eulerAngles.clone();

        node.setScale(0, 0, 0);
        node.setRotationFromEuler(0, 0, 0);

        // Scale animation
        tween(node)
            .to(0.3, { scale: originalScale.clone().multiplyScalar(1.3) }, { easing: 'backOut' })
            .to(0.15, { scale: originalScale }, { easing: 'sineOut' })
            .start();

        // Rotation animation
        tween(node)
            .to(0.45, { eulerAngles: new Vec3(0, 360, 0) }, { easing: 'quadOut' })
            .call(() => {
                node.setRotationFromEuler(originalRotation.x, originalRotation.y, originalRotation.z);
            })
            .start();
    }

    /**
     * Animation 3: Elastic overshoot
     */
    private playElasticAnimation(node: Node) {
        const originalScale = node.scale.clone();
        node.setScale(0, 0, 0);

        tween(node)
            .to(0.2, { scale: originalScale.clone().multiplyScalar(1.6) }, { easing: 'backOut' })
            .to(0.12, { scale: originalScale.clone().multiplyScalar(0.8) }, { easing: 'quadInOut' })
            .to(0.1, { scale: originalScale.clone().multiplyScalar(1.1) }, { easing: 'quadInOut' })
            .to(0.08, { scale: originalScale }, { easing: 'quadOut' })
            .start();
    }

    /**
     * Animation 4: Drop from above with bounce
     */
    private playDropBounceAnimation(node: Node) {
        const originalScale = node.scale.clone();
        const originalPos = node.position.clone();

        node.setScale(originalScale.x, originalScale.y, originalScale.z);
        node.setPosition(originalPos.x, originalPos.y + 2, originalPos.z);

        // Drop animation
        tween(node)
            .to(0.25, { position: originalPos }, { easing: 'bounceOut' })
            .start();

        // Scale pulse during drop
        tween(node)
            .to(0.15, { scale: originalScale.clone().multiplyScalar(1.2) }, { easing: 'quadOut' })
            .to(0.1, { scale: originalScale }, { easing: 'quadOut' })
            .start();
    }

    /**
     * Animation 5: Wobble scale-in
     */
    private playWobbleAnimation(node: Node) {
        const originalScale = node.scale.clone();
        node.setScale(0, 0, 0);

        tween(node)
            .to(0.15, { scale: originalScale.clone().multiplyScalar(1.3) }, { easing: 'backOut' })
            .to(0.08, { scale: new Vec3(originalScale.x * 0.9, originalScale.y * 1.1, originalScale.z) }, { easing: 'quadInOut' })
            .to(0.08, { scale: new Vec3(originalScale.x * 1.05, originalScale.y * 0.95, originalScale.z) }, { easing: 'quadInOut' })
            .to(0.08, { scale: originalScale }, { easing: 'quadOut' })
            .start();
    }

    // Helper method to add a node at runtime
    addNode(node: Node) {
        if (node && this.nodes.indexOf(node) === -1) {
            this.nodes.push(node);
        }
    }

    // Helper method to remove a node
    removeNode(node: Node) {
        const index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }
    }

    // Helper method to get a node by index
    getNode(index: number): Node | null {
        return this.nodes[index] || null;
    }

    // Helper method to clear all nodes
    clearNodes() {
        this.nodes = [];
    }
    onLoad() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private onKeyDown(event: EventKeyboard) {
        if (event.keyCode === KeyCode.SPACE) {
        }
    }
}