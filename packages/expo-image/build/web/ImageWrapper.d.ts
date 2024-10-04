import React, { CSSProperties, SyntheticEvent } from 'react';
import { ImageContentPositionObject, ImageSource } from '../Image.types';
import { SrcSetSource } from './useSourceSelection';
declare const ImageWrapper: React.ForwardRefExoticComponent<{
    source?: ImageSource | SrcSetSource | null | undefined;
    events?: {
        onLoad?: (((event: SyntheticEvent<HTMLImageElement, Event>) => void) | null | undefined)[] | undefined;
        onError?: ((({ source }: {
            source: ImageSource | null;
        }) => void) | null | undefined)[] | undefined;
        onTransitionEnd?: ((() => void) | null | undefined)[] | undefined;
        onMount?: ((() => void) | null | undefined)[] | undefined;
    } | undefined;
    contentPosition?: ImageContentPositionObject | undefined;
    hashPlaceholderContentPosition?: ImageContentPositionObject | undefined;
    priority?: string | null | undefined;
    style: CSSProperties;
    tintColor?: string | null | undefined;
    hashPlaceholderStyle?: React.CSSProperties | undefined;
    className?: string | undefined;
    accessibilityLabel?: string | undefined;
} & React.RefAttributes<HTMLImageElement>>;
export default ImageWrapper;
//# sourceMappingURL=ImageWrapper.d.ts.map