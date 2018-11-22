declare type EventNameType = 'interstitialDidLoad' | 'interstitialDidFailToLoad' | 'interstitialDidOpen' | 'interstitialDidClose' | 'interstitialWillLeaveApplication';
declare const _default: {
    setAdUnitID: (id: string) => Promise<void>;
    setTestDeviceID: (id: string) => Promise<void>;
    requestAdAsync: () => Promise<void>;
    showAdAsync: () => Promise<void>;
    dismissAdAsync: () => Promise<void>;
    getIsReadyAsync: () => Promise<boolean>;
    addEventListener: (type: EventNameType, handler: Function) => void;
    removeEventListener: (type: EventNameType, handler: Function) => void;
    removeAllListeners: () => void;
};
export default _default;
