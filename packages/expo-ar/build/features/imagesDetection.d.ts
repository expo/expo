declare type DetectionImage = {
    uri: string;
    width: number;
    name?: string;
};
/**
 * Instructs AR to look for provided images
 * @param images
 */
export declare function setDetectionImagesAsync(images: {
    [name: string]: DetectionImage;
}): Promise<void>;
export {};
