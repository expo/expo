import { ConfigPlugin } from '@expo/config-plugins';
import { ContentsJsonImage } from '../../icons/AssetContents';
import { IOSSplashConfig } from './getIosSplashConfig';
export declare const withIosSplashAssets: ConfigPlugin<IOSSplashConfig>;
export declare function buildContentsJsonImages({ image, darkImage, tabletImage, darkTabletImage, }: {
    image: string;
    tabletImage: string | null;
    darkImage: string | null;
    darkTabletImage: string | null;
}): ContentsJsonImage[];
