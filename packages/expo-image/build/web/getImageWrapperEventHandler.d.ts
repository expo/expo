import { ImageWrapperEvents } from './ImageWrapper.types';
import { ImageSource } from '../Image.types';
export declare function getImageWrapperEventHandler(events: ImageWrapperEvents | undefined, source: ImageSource): {
    onLoad: (event: any) => void;
    onTransitionEnd: () => void | undefined;
    onError: () => void;
};
//# sourceMappingURL=getImageWrapperEventHandler.d.ts.map