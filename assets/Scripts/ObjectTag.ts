import { _decorator, Component, Enum, Node } from 'cc';
import { ObjectTags } from './Constants';
const { ccclass, property } = _decorator;

Enum(ObjectTags);

@ccclass('ObjectTag')
export class ObjectTag extends Component {
    @property({ type: Enum(ObjectTags) })
    tag: ObjectTags = ObjectTags.Tag_1;

    @property(Node)
    targetPosition: Node = null

    start() {

    }

    update(deltaTime: number) {

    }

}


