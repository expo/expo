import { OnErrorEvent } from './ImageWrapper.types';
import { ImageNativeProps, ImageSource } from '../Image.types';
export declare function useThumbhash(source: ImageSource | null | undefined): readonly [{
    uri: string;
} | null, boolean];
export declare function useImageHashes(source: ImageSource | null | undefined): {
    resolvedSource: ImageSource | null | undefined;
    isImageHash: boolean;
} | {
    resolvedSource: {
        uri: string;
    } | null;
    isImageHash: boolean;
};
export declare function useHeaders(source: ImageSource | null | undefined, cachePolicy: ImageNativeProps['cachePolicy'], onError?: OnErrorEvent[]): ImageSource | null | undefined;
//# sourceMappingURL=hooks.d.ts.map