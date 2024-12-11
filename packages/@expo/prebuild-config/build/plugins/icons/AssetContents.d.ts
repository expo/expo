export type ContentsJsonImageIdiom = 'iphone' | 'ipad' | 'watchos' | 'ios' | 'ios-marketing' | 'universal';
export type ContentsJsonImageAppearanceLuminosityType = 'light' | 'dark' | 'tinted';
export type ContentsJsonAppearance = {
    appearance: 'luminosity';
    value: ContentsJsonImageAppearanceLuminosityType;
};
export type ContentsJsonImageScale = '1x' | '2x' | '3x';
export interface ContentsJsonImage {
    appearances?: ContentsJsonAppearance[];
    idiom: ContentsJsonImageIdiom;
    size?: string;
    scale?: ContentsJsonImageScale;
    filename?: string;
    platform?: ContentsJsonImageIdiom;
}
export interface ContentsJsonColor {
    appearances?: ContentsJsonAppearance[];
    idiom: ContentsJsonImageIdiom;
    color: {
        'color-space': 'srgb';
        components: {
            alpha: string;
            blue: string;
            green: string;
            red: string;
        };
    };
}
export interface ContentsJson {
    images: ContentsJsonImage[];
    colors: ContentsJsonColor[];
    info: {
        version: number;
        author: string;
    };
}
export declare function createContentsJsonItem(item: ContentsJsonImage): ContentsJsonImage;
/**
 * Writes the Config.json which is used to assign images to their respective platform, dpi, and idiom.
 *
 * @param directory path to add the Contents.json to.
 * @param contents image json data
 */
export declare function writeContentsJsonAsync(directory: string, { images }: Pick<ContentsJson, 'images'>): Promise<void>;
