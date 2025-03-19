import type { SharedRefType } from 'expo';
import React from 'react';
import { ImageSource } from '../Image.types';
export interface SrcSetSource extends ImageSource {
    srcset: string;
    sizes: string;
    uri: string;
    type: 'srcset';
}
export default function useSourceSelection(sources: ImageSource[] | SharedRefType<'image'> | undefined, responsivePolicy: "live" | "initial" | "static" | undefined, containerRef: React.RefObject<HTMLDivElement | null>, measurementCallback?: ((target: HTMLElement, size: DOMRect) => void) | null): ImageSource | SrcSetSource | SharedRefType<'image'> | null;
//# sourceMappingURL=useSourceSelection.d.ts.map