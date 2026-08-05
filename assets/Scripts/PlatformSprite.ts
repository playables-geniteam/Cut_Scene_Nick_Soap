import { _decorator, Component, Sprite, SpriteFrame } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('PlatformSprite')
export class PlatformSprite extends Component {

    @property(Sprite)
    targetSprite: Sprite | null = null;

    @property(SpriteFrame)
    androidSprite: SpriteFrame | null = null;

    @property(SpriteFrame)
    iosSprite: SpriteFrame | null = null;

    start() {
        if (!this.targetSprite) {
            this.targetSprite = this.getComponent(Sprite);
        }

        if (!this.targetSprite) return;

        if (this.isIOS()) {
            this.targetSprite.spriteFrame = this.iosSprite;
        } else {
            // Android or unknown
            this.targetSprite.spriteFrame = this.androidSprite;
        }
    }

    private isIOS(): boolean {
        const ua = navigator.userAgent.toLowerCase();

        // iPhone, iPad, iPod
        if (/iphone|ipad|ipod/.test(ua)) {
            return true;
        }

        // iPadOS 13+ (reports itself as Mac)
        if (
            navigator.platform === 'MacIntel' &&
            (navigator as any).maxTouchPoints > 1
        ) {
            return true;
        }

        // User-Agent Client Hints
        const uaData = (navigator as any).userAgentData;
        if (uaData?.platform === 'iOS') {
            return true;
        }

        return false;
    }
}