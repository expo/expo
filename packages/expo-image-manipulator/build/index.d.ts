declare type ImageResult = {
    uri: string;
    width: number;
    height: number;
    base64?: string;
};
declare type ActionResize = {
    resize: {
        width?: number;
        height?: number;
    };
};
declare type ActionRotate = {
    rotate: number;
};
declare type ActionFlip = {
    flip: {
        vertical: boolean;
    } | {
        horizontal: boolean;
    };
};
declare type ActionCrop = {
    crop: {
        originX: number;
        originY: number;
        width: number;
        height: number;
    };
};
declare type Action = ActionResize | ActionRotate | ActionFlip | ActionCrop;
interface SaveOptions {
    base64?: boolean;
    compress?: number;
    format?: 'jpeg' | 'png';
}
export declare function manipulateAsync(uri: string, actions?: Action[], saveOptions?: SaveOptions): Promise<ImageResult>;
export {};
