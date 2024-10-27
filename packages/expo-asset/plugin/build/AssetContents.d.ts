type ContentsJsonImageScale = '1x' | '2x' | '3x';
type ContentsJsonImageIdiom = 'iphone' | 'ipad' | 'watchos' | 'ios' | 'ios-marketing' | 'universal';
type ContentsJsonImageAppearance = {
    appearance: 'luminosity';
    value: 'dark';
};
export interface ContentsJsonImage {
    appearances?: ContentsJsonImageAppearance[];
    idiom: ContentsJsonImageIdiom;
    size?: string;
    scale?: ContentsJsonImageScale;
    filename?: string;
    platform?: ContentsJsonImageIdiom;
}
export interface ContentsJson {
    images: ContentsJsonImage[];
    info: {
        version: number;
        author: string;
    };
}
/**
 * Writes the Config.json which is used to assign images to their respective platform, dpi, and idiom.
 *
 * @param directory path to add the Contents.json to.
 * @param contents image json data
 */
export declare function writeContentsJsonAsync(directory: string, { images }: Pick<ContentsJson, 'images'>): Promise<void>;
export {};
