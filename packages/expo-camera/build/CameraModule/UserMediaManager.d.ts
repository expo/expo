export declare let userMediaRequested: boolean;
export declare let mountedInstances: any[];
export declare function requestUserMediaAsync(props: {
    audio?: any;
    video?: any;
}, isMuted?: boolean): Promise<MediaStream>;
export declare function getAnyUserMediaAsync(constraints: MediaStreamConstraints, ignoreConstraints?: boolean): Promise<MediaStream>;
export declare function getUserMediaAsync(constraints: MediaStreamConstraints): Promise<MediaStream>;
export declare function canGetUserMedia(): boolean;
export declare function supportsFrontCamera(devices?: MediaDeviceInfo[]): Promise<null | string>;
export declare function supportsBackCamera(devices?: MediaDeviceInfo[]): Promise<null | string>;
