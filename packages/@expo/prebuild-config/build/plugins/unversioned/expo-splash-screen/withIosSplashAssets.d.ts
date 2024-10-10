import { ConfigPlugin } from '@expo/config-plugins';
import { IOSPluginConfig } from './getIosSplashConfig';
import { ContentsJsonImage } from '../../icons/AssetContents';
export declare const withIosSplashAssets: ConfigPlugin<IOSPluginConfig>;
export declare function buildContentsJsonImages({ image, darkImage, tabletImage, darkTabletImage, }: {
    image: string;
    tabletImage: string | null;
    darkImage: string | null;
    darkTabletImage: string | null;
}): ContentsJsonImage[];
