export declare type ContentsJsonImageIdiom = 'iphone' | 'ipad' | 'ios-marketing' | 'universal';
export declare type ContentsJsonImageAppearance = {
    appearance: 'luminosity';
    value: 'dark';
};
export declare type ContentsJsonImageScale = '1x' | '2x' | '3x';
export interface ContentsJsonImage {
    appearances?: ContentsJsonImageAppearance[];
    idiom: ContentsJsonImageIdiom;
    size?: string;
    scale: ContentsJsonImageScale;
    filename?: string;
}
export interface ContentsJson {
    images: ContentsJsonImage[];
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
