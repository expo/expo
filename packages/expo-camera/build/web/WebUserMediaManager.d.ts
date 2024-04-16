export declare const userMediaRequested: boolean;
export declare const mountedInstances: any[];
export declare function requestUserMediaAsync(props: {
    audio?: any;
    video?: any;
}, isMuted?: boolean): Promise<MediaStream>;
export declare function getAnyUserMediaAsync(constraints: MediaStreamConstraints, ignoreConstraints?: boolean): Promise<MediaStream>;
export declare function getUserMediaAsync(constraints: MediaStreamConstraints): Promise<MediaStream>;
export declare function canGetUserMedia(): boolean;
export declare function isFrontCameraAvailableAsync(devices?: MediaDeviceInfo[]): Promise<null | string>;
export declare function isBackCameraAvailableAsync(devices?: MediaDeviceInfo[]): Promise<null | string>;
//# sourceMappingURL=WebUserMediaManager.d.ts.map