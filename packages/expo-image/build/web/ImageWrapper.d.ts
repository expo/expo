import React, { CSSProperties, SyntheticEvent } from 'react';
import { ImageContentPositionObject, ImageSource } from '../Image.types';
declare const ImageWrapper: React.ForwardRefExoticComponent<{
    source?: ImageSource | null | undefined;
    events?: {
        onLoad?: (((event: SyntheticEvent<HTMLImageElement, Event>) => void) | undefined)[] | undefined;
        onError?: ((({ source }: {
            source: ImageSource | null;
        }) => void) | undefined)[] | undefined;
        onTransitionEnd?: ((() => void) | undefined)[] | undefined;
        onMount?: ((() => void) | undefined)[] | undefined;
    } | undefined;
    contentPosition?: ImageContentPositionObject | undefined;
    blurhashContentPosition?: ImageContentPositionObject | undefined;
    priority?: string | null | undefined;
    style: CSSProperties;
    blurhashStyle?: React.CSSProperties | undefined;
    className?: string | undefined;
} & React.RefAttributes<HTMLImageElement>>;
export default ImageWrapper;
//# sourceMappingURL=ImageWrapper.d.ts.map