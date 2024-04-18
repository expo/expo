import React from 'react';
import { ImageProps, ImageSource } from '../Image.types';
export interface SrcSetSource extends ImageSource {
    srcset: string;
    sizes: string;
    uri: string;
    type: 'srcset';
}
export default function useSourceSelection(sources: ImageSource[] | undefined, responsivePolicy: ImageProps['responsivePolicy'], containerRef: React.MutableRefObject<HTMLDivElement | null>, measurementCallback?: ((target: HTMLElement, size: DOMRect) => void) | null): ImageSource | SrcSetSource | null;
//# sourceMappingURL=useSourceSelection.d.ts.map