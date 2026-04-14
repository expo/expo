import { ConfigPlugin } from 'expo/config-plugins';
import { IOSSplashConfig } from './types';
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
    tabletImage: string | undefined;
    darkImage: string | undefined;
    darkTabletImage: string | undefined;
}): ContentsJsonImage[];
export {};
