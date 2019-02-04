export declare type ImageResult = {
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
export declare enum FlipType {
    VERTICAL = "vertical",
    HORIZONTAL = "horizontal"
}
declare type ActionFlip = {
    flip: FlipType;
};
declare type ActionCrop = {
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
    PNG = "png"
}
export interface SaveOptions {
    base64?: boolean;
    compress?: number;
    format?: SaveFormat;
}
export {};
