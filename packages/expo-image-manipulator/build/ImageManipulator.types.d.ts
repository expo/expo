export declare type ImageResult = {
    uri: string;
    width: number;
    height: number;
    base64?: string;
};
export declare type ActionResize = {
    resize: {
        width?: number;
        height?: number;
    };
};
export declare type ActionRotate = {
    rotate: number;
};
export declare enum FlipType {
    Vertical = "vertical",
    Horizontal = "horizontal"
}
export declare type ActionFlip = {
    flip: FlipType;
};
export declare type ActionCrop = {
    crop: {
        originX: number;
        originY: number;
        width: number;
        height: number;
    };
};
export declare type Action = ActionResize | ActionRotate | ActionFlip | ActionCrop;
export declare enum SaveFormat {
    JPEG = "jpeg",
    PNG = "png",
    WEBP = "webp"
}
export interface SaveOptions {
    base64?: boolean;
    compress?: number;
    format?: SaveFormat;
}
