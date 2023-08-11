import { CSSProperties, SyntheticEvent } from 'react';
import { SrcSetSource } from './useSourceSelection';
import { ImageContentPositionObject, ImageSource } from '../Image.types';
export type ImageWrapperEvents = {
    onLoad?: (((event: SyntheticEvent<HTMLImageElement, Event>) => void) | undefined | null)[];
    onError?: ((({ source }: {
        source: ImageSource | null;
    }) => void) | undefined | null)[];
    onTransitionEnd?: ((() => void) | undefined | null)[];
    onMount?: ((() => void) | undefined | null)[];
};
export type ImageWrapperProps = {
    source?: ImageSource | SrcSetSource | null;
    events?: ImageWrapperEvents;
    contentPosition?: ImageContentPositionObject;
    hashPlaceholderContentPosition?: ImageContentPositionObject;
    priority?: string | null;
    style: CSSProperties;
    tintColor?: string | null;
    hashPlaceholderStyle?: CSSProperties;
    className?: string;
    accessibilityLabel?: string;
};
//# sourceMappingURL=ImageWrapper.types.d.ts.map