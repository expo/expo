import { ConfigPlugin } from 'expo/config-plugins';
import { IOSSplashConfig } from './getIosSplashConfig';
declare const darkAppearances: readonly [{
    readonly appearance: "luminosity";
    readonly value: "dark";
}];
interface ContentsJsonImage {
    appearances?: typeof darkAppearances;
    filename?: string;
    idiom: 'universal' | 'ipad';
    scale?: '1x' | '2x' | '3x';
}
export declare const withIosSplashAssets: ConfigPlugin<IOSSplashConfig>;
export declare function buildContentsJsonImages({ image, darkImage, tabletImage, darkTabletImage, }: {
    image: string;
    tabletImage: string | null;
    darkImage: string | null;
    darkTabletImage: string | null;
}): ContentsJsonImage[];
export {};
