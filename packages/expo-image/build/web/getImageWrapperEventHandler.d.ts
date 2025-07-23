import type { SyntheticEvent } from 'react';
import type { ImageWrapperEvents } from './ImageWrapper.types';
import type { ImageSource } from '../Image.types';
export declare function getImageWrapperEventHandler(events: ImageWrapperEvents | undefined, source: ImageSource): {
    onLoad: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
    onTransitionEnd: () => void | undefined;
    onError: () => void;
};
//# sourceMappingURL=getImageWrapperEventHandler.d.ts.map