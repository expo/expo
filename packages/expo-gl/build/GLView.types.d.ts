export declare type SurfaceCreateEvent = {
    nativeEvent: {
        exglCtxId: number;
    };
};
export declare type SnapshotOptions = {
    flip?: boolean;
    framebuffer?: WebGLFramebuffer;
    rect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    format?: 'jpeg' | 'png';
    compress?: number;
};
