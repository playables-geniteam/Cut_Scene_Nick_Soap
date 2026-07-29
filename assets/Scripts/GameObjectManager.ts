import { _decorator, Component, Node, Vec3, Quat, Color, find, director, instantiate, Prefab } from 'cc';
const { ccclass, property } = _decorator;

// ─────────────────────────────────────────────
//  GameObject Utility  — Unity-style helpers
//  for Cocos Creator
// ─────────────────────────────────────────────

@ccclass('GameObjectManager')
export class GameObjectManager extends Component {

    // ── Serialized / Inspector fields ──────────
    @property(Node)
    targetNode: Node | null = null;

    /** Nodes to turn ON together (e.g. on a button click) */
    @property({ type: [Node] })
    enableGroup: Node[] = [];

    /** Nodes to turn OFF together (e.g. on a button click) */
    @property({ type: [Node] })
    disableGroup: Node[] = [];

    /** Nodes to flip (ON→OFF / OFF→ON) together */
    @property({ type: [Node] })
    toggleGroup: Node[] = [];

    // ── Lifecycle ──────────────────────────────

    start() {
        // Example usage — remove / replace with your own logic
        this.exampleUsage();
    }

    update(deltaTime: number) {
        // Your per-frame logic here
    }

    // ══════════════════════════════════════════
    //  1. ACTIVE / ENABLE  (Unity SetActive)
    // ══════════════════════════════════════════

    /** Toggle a node on or off — equivalent to Unity's gameObject.SetActive(value) */
    setActive(node: Node, active: boolean): void {
        if (!node) return;
        node.active = active;
    }

    /** Returns whether the node is active in the hierarchy */
    isActive(node: Node): boolean {
        return node?.active ?? false;
    }

    /** Toggle current active state */
    toggleActive(node: Node): void {
        if (!node) return;
        node.active = !node.active;
    }

    /** Enable / disable a specific Component on a node */
    setComponentEnabled<T extends Component>(node: Node, type: new () => T, enabled: boolean): void {
        const comp = node?.getComponent(type);
        if (comp) comp.enabled = enabled;
    }

    // ══════════════════════════════════════════
    //  2. FIND  (Unity GameObject.Find / FindWithTag)
    // ══════════════════════════════════════════

    /** Find a node anywhere in the scene by its full path or name */
    findNode(path: string): Node | null {
        return find(path);
    }

    /** Find the first node whose name equals `name` under `root` (BFS) */
    findByName(name: string, root?: Node): Node | null {
        const searchRoot = root ?? director.getScene();
        if (!searchRoot) return null;
        return this._bfsFind(searchRoot, (n) => n.name === name);
    }

    /** Find all nodes whose name equals `name` under `root` */
    findAllByName(name: string, root?: Node): Node[] {
        const searchRoot = root ?? director.getScene();
        if (!searchRoot) return [];
        return this._collectAll(searchRoot, (n) => n.name === name);
    }

    /** Find the first node that has a component of `type` under `root` */
    findByComponent<T extends Component>(type: new () => T, root?: Node): Node | null {
        const searchRoot = root ?? director.getScene();
        if (!searchRoot) return null;
        return this._bfsFind(searchRoot, (n) => !!n.getComponent(type));
    }

    // ══════════════════════════════════════════
    //  3. INSTANTIATE / DESTROY  (Unity Instantiate / Destroy)
    // ══════════════════════════════════════════

    /** Clone a node or prefab — equivalent to Unity's Instantiate() */
    spawnObject(original: Node | Prefab, parent?: Node): Node {
        const clone = instantiate(original) as unknown as Node;
        if (parent) clone.setParent(parent);
        return clone;
    }

    /** Destroy a node immediately */
    destroyNode(node: Node): void {
        if (node && node.isValid) node.destroy();
    }

    /** Destroy a node after `delaySeconds` */
    destroyDelayed(node: Node, delaySeconds: number): void {
        this.scheduleOnce(() => this.destroyNode(node), delaySeconds);
    }

    /** Remove all children of a node */
    clearChildren(node: Node): void {
        if (!node) return;
        node.children.slice().forEach((child) => child.destroy());
    }

    // ══════════════════════════════════════════
    //  4. TRANSFORM  (position, rotation, scale)
    // ══════════════════════════════════════════

    /** Set world position */
    setPosition(node: Node, x: number, y: number, z: number = 0): void {
        node?.setWorldPosition(new Vec3(x, y, z));
    }

    /** Set local position */
    setLocalPosition(node: Node, x: number, y: number, z: number = 0): void {
        node?.setPosition(new Vec3(x, y, z));
    }

    /** Get world position */
    getPosition(node: Node): Vec3 {
        return node?.getWorldPosition() ?? Vec3.ZERO.clone();
    }

    /** Translate (move) by a delta in world space */
    translate(node: Node, dx: number, dy: number, dz: number = 0): void {
        if (!node) return;
        const pos = node.getWorldPosition();
        node.setWorldPosition(new Vec3(pos.x + dx, pos.y + dy, pos.z + dz));
    }

    /** Set uniform scale */
    setScale(node: Node, scale: number): void {
        node?.setScale(new Vec3(scale, scale, scale));
    }

    /** Set non-uniform scale */
    setScaleXYZ(node: Node, x: number, y: number, z: number = 1): void {
        node?.setScale(new Vec3(x, y, z));
    }

    /** Set euler rotation (degrees) */
    setRotation(node: Node, x: number, y: number, z: number): void {
        if (!node) return;
        const q = new Quat();
        Quat.fromEuler(q, x, y, z);
        node.setWorldRotation(q);
    }

    /** Rotate around Z axis by `degrees` (2-D shorthand) */
    rotate2D(node: Node, degrees: number): void {
        if (!node) return;
        node.angle += degrees;
    }

    /** Point node toward a world-space target (2-D) */
    lookAt2D(node: Node, target: Vec3): void {
        if (!node) return;
        const pos = node.getWorldPosition();
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        node.angle = Math.atan2(dy, dx) * (180 / Math.PI);
    }

    // ══════════════════════════════════════════
    //  5. HIERARCHY  (parent / child management)
    // ══════════════════════════════════════════

    /** Re-parent a node, keeping its world transform */
    setParent(node: Node, newParent: Node): void {
        if (!node) return;
        node.setParent(newParent, true);   // true = keep world position
    }

    /** Detach from parent (moves to scene root) */
    detachFromParent(node: Node): void {
        const scene = director.getScene();
        if (node && scene) node.setParent(scene, true);
    }

    /** Get child by index */
    getChild(node: Node, index: number): Node | null {
        return node?.children[index] ?? null;
    }

    /** Get child by name */
    getChildByName(node: Node, name: string): Node | null {
        return node?.getChildByName(name) ?? null;
    }

    // ══════════════════════════════════════════
    //  6. COMPONENT HELPERS  (GetComponent etc.)
    // ══════════════════════════════════════════

    /** Get component — equivalent to Unity's GetComponent<T>() */
    getComp<T extends Component>(node: Node, type: new () => T): T | null {
        return node?.getComponent(type) ?? null;
    }

    /** Get component in children (including self) */
    getCompInChildren<T extends Component>(node: Node, type: new () => T): T | null {
        return node?.getComponentInChildren(type) ?? null;
    }

    /** Get all components of type in children */
    getCompsInChildren<T extends Component>(node: Node, type: new () => T): T[] {
        return node?.getComponentsInChildren(type) ?? [];
    }

    /** Add a component if not already present */
    addCompIfMissing<T extends Component>(node: Node, type: new () => T): T {
        return node.getComponent(type) ?? node.addComponent(type);
    }

    // ══════════════════════════════════════════
    //  7. LAYER & VISIBILITY
    // ══════════════════════════════════════════

    /** Show / hide by layer mask (useful with cameras) */
    setLayer(node: Node, layer: number): void {
        if (!node) return;
        node.layer = layer;
    }

    // ══════════════════════════════════════════
    //  8. TAGGING  (simple string-tag system)
    //     Cocos has no built-in tags — we store
    //     them in node.userData via a convention.
    // ══════════════════════════════════════════

    /** Assign a custom tag string to a node */
    setTag(node: Node, tag: string): void {
        if (!node) return;
        (node as any)._customTag = tag;
    }

    /** Read the custom tag string */
    getTag(node: Node): string {
        return (node as any)?._customTag ?? '';
    }

    /** Compare tag — equivalent to Unity's CompareTag */
    compareTag(node: Node, tag: string): boolean {
        return this.getTag(node) === tag;
    }

    /** Find first node with a given custom tag under `root` */
    findWithTag(tag: string, root?: Node): Node | null {
        const searchRoot = root ?? director.getScene();
        if (!searchRoot) return null;
        return this._bfsFind(searchRoot, (n) => this.compareTag(n, tag));
    }

    /** Find all nodes with a given custom tag under `root` */
    findAllWithTag(tag: string, root?: Node): Node[] {
        const searchRoot = root ?? director.getScene();
        if (!searchRoot) return [];
        return this._collectAll(searchRoot, (n) => this.compareTag(n, tag));
    }

    // ══════════════════════════════════════════
    //  9. NODE GROUPS  (Inspector arrays)
    //     Drag nodes into each group in the
    //     Inspector, then call one method to
    //     act on all of them at once.
    // ══════════════════════════════════════════

    /** Turn ON every node in enableGroup */
    activateAll(): void {
        this.enableGroup.forEach(n => this.setActive(n, true));
    }

    /** Turn OFF every node in disableGroup */
    deactivateAll(): void {
        this.disableGroup.forEach(n => this.setActive(n, false));
    }

    /** Flip every node in toggleGroup (ON→OFF / OFF→ON) */
    toggleAll(): void {
        this.toggleGroup.forEach(n => this.toggleActive(n));
    }

    /**
     * ONE call does all three at once:
     *  • enableGroup  → all turn ON
     *  • disableGroup → all turn OFF
     *  • toggleGroup  → all flip
     *
     * Bind this to a button click in the Inspector.
     */
    applyGroups(): void {
        this.activateAll();
        this.deactivateAll();
        this.toggleAll();
    }

    // ══════════════════════════════════════════
    //  10. MISC UTILITIES
    // ══════════════════════════════════════════

    /** Calculate world-space distance between two nodes */
    distanceBetween(a: Node, b: Node): number {
        const pa = a.getWorldPosition();
        const pb = b.getWorldPosition();
        return Vec3.distance(pa, pb);
    }

    /** Clone userData object onto a node (Unity-style extra data) */
    setUserData(node: Node, data: Record<string, any>): void {
        Object.assign((node as any), { _userData: data });
    }

    getUserData(node: Node): Record<string, any> {
        return (node as any)._userData ?? {};
    }

    // ══════════════════════════════════════════
    //  PRIVATE HELPERS
    // ══════════════════════════════════════════

    private _bfsFind(root: Node, predicate: (n: Node) => boolean): Node | null {
        const queue: Node[] = [root];
        while (queue.length) {
            const current = queue.shift()!;
            if (predicate(current)) return current;
            queue.push(...current.children);
        }
        return null;
    }

    private _collectAll(root: Node, predicate: (n: Node) => boolean): Node[] {
        const results: Node[] = [];
        const queue: Node[] = [root];
        while (queue.length) {
            const current = queue.shift()!;
            if (predicate(current)) results.push(current);
            queue.push(...current.children);
        }
        return results;
    }

    // ══════════════════════════════════════════
    //  EXAMPLE USAGE  (delete when ready)
    // ══════════════════════════════════════════

    private exampleUsage(): void {
        if (!this.targetNode) return;

        // — Active / Inactive —
        this.setActive(this.targetNode, false);       // hide
        this.setActive(this.targetNode, true);        // show
        this.toggleActive(this.targetNode);           // flip

        // — Transform —
        this.setPosition(this.targetNode, 100, 200);
        this.translate(this.targetNode, 10, 0);
        this.setScale(this.targetNode, 2);
        this.setRotation(this.targetNode, 0, 0, 45);
        this.rotate2D(this.targetNode, 30);

        // — Find —
        const found = this.findByName('Enemy');
        const allEnemies = this.findAllByName('Enemy');

        // — Tagging —
        if (found) {
            this.setTag(found, 'Enemy');
            console.log(this.compareTag(found, 'Enemy')); // true
        }

        // — Hierarchy —
        if (found) this.setParent(found, this.targetNode);

        // — Node Groups (drag nodes into each array in Inspector) —
        // this.activateAll();   // turn ON  everything in enableGroup
        // this.deactivateAll(); // turn OFF everything in disableGroup
        // this.toggleAll();     // flip     everything in toggleGroup
        // this.applyGroups();   // do ALL three at once — bind this to a button!
        // — Instantiate —
        // const clone = this.spawnObject(this.targetNode, parentNode);
    }
}