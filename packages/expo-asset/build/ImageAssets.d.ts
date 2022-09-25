declare type ImageInfo = {
    name: string;
    width: number;
    height: number;
};
export declare function isImageType(type: string): boolean;
export declare function getImageInfoAsync(url: string): Promise<ImageInfo>;
export {};
//# sourceMappingURL=ImageAssets.d.ts.map