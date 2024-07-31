import React from 'react';
import { ImageRef, ImageSource } from '../Image.types';
export interface SrcSetSource extends ImageSource {
    srcset: string;
    sizes: string;
    uri: string;
    type: 'srcset';
}
export default function useSourceSelection(sources: ImageSource[] | ImageRef | undefined, responsivePolicy: "live" | "initial" | "static" | undefined, containerRef: React.MutableRefObject<HTMLDivElement | null>, measurementCallback?: ((target: HTMLElement, size: DOMRect) => void) | null): ImageSource | SrcSetSource | ImageRef | null;
//# sourceMappingURL=useSourceSelection.d.ts.map