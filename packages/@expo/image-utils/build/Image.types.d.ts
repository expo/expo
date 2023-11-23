export declare type ResizeMode = 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
export declare type ImageFormat = 'input' | 'jpeg' | 'jpg' | 'png' | 'raw' | 'tiff' | 'webp';
export declare type ImageOptions = {
    src: string;
    name?: string;
    resizeMode: ResizeMode;
    backgroundColor: string;
    removeTransparency?: boolean;
    width: number;
    height: number;
    padding?: number;
    borderRadius?: number;
};
