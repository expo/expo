declare type EventNameType = 'rewardedVideoDidRewardUser' | 'rewardedVideoDidLoad' | 'rewardedVideoDidFailToLoad' | 'rewardedVideoDidOpen' | 'rewardedVideoDidStart' | 'rewardedVideoDidClose' | 'rewardedVideoWillLeaveApplication';
declare type EventListener = (...args: any[]) => void;
declare const _default: {
    setAdUnitID(id: string): Promise<void>;
    /** @deprecated Test device IDs are now set globally. Use `AdMob.setTestDeviceIDAsync` instead. */
    setTestDeviceID(id: string): Promise<void>;
    requestAdAsync(options?: {
        servePersonalizedAds?: boolean | undefined;
        additionalRequestParams?: {
            [key: string]: string;
        } | undefined;
    }): Promise<void>;
    showAdAsync(): Promise<void>;
    dismissAdAsync(): Promise<void>;
    getIsReadyAsync(): Promise<boolean>;
    addEventListener(type: EventNameType, handler: EventListener): void;
    removeEventListener(type: EventNameType, handler: EventListener): void;
    removeAllListeners(): void;
};
export default _default;
