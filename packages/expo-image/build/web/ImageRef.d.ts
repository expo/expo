import { SharedRef } from 'expo';
import { ImageRef } from '../Image.types';
export default class ImageRefWeb extends SharedRef implements ImageRef {
    uri: string | null;
    width: number;
    height: number;
    mediaType: string | null;
    scale: number;
    isAnimated: boolean;
    static init(uri: string, width: number, height: number, mediaType: string | null): ImageRefWeb;
}
//# sourceMappingURL=ImageRef.d.ts.map