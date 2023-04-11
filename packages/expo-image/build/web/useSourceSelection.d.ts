import { ImageProps, ImageSource } from '../Image.types';
export interface SrcSetSource extends ImageSource {
    srcset: string;
    sizes: string;
    uri: string;
    type: 'srcset';
}
export default function useSourceSelection(sources?: ImageSource[], responsivePolicy?: ImageProps['responsivePolicy'], measurementCallback?: (target: HTMLElement, size: DOMRect) => void): {
    containerRef: (element: HTMLDivElement) => void;
    source: ImageSource | SrcSetSource | null;
};
//# sourceMappingURL=useSourceSelection.d.ts.map