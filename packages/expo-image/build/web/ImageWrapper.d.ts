import React, { CSSProperties, SyntheticEvent } from 'react';
import { ImageContentPositionObject, ImageSource } from '../Image.types';
declare const ImageWrapper: React.ForwardRefExoticComponent<{
    source?: ImageSource | null | undefined;
    events?: {
        onLoad?: (((event: SyntheticEvent<HTMLImageElement, Event>) => void) | null | undefined)[] | undefined;
        onError?: ((({ source }: {
            source: ImageSource | null;
        }) => void) | null | undefined)[] | undefined;
        onTransitionEnd?: ((() => void) | null | undefined)[] | undefined;
        onMount?: ((() => void) | null | undefined)[] | undefined;
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