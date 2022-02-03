declare const eventNames: readonly ["rewardedVideoUserDidEarnReward", "rewardedVideoDidLoad", "rewardedVideoDidFailToLoad", "rewardedVideoDidPresent", "rewardedVideoDidFailToPresent", "rewardedVideoDidDismiss"];
declare type EventNameType = typeof eventNames[number];
declare type EventListener = (...args: any[]) => void;
declare const _default: {
    setAdUnitID(id: string): Promise<void>;
    requestAdAsync(options?: {
        servePersonalizedAds?: boolean;
        additionalRequestParams?: Record<string, string>;
    }): Promise<void>;
    showAdAsync(): Promise<void>;
    dismissAdAsync(): Promise<void>;
    getIsReadyAsync(): Promise<boolean>;
    addEventListener(type: EventNameType, handler: EventListener): void;
    removeEventListener(type: EventNameType, handler: EventListener): void;
    removeAllListeners(): void;
};
export default _default;
//# sourceMappingURL=AdMobRewarded.d.ts.map