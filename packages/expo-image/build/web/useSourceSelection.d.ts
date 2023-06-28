import { ImageProps, ImageSource } from '../Image.types';
export interface SrcSetSource extends ImageSource {
    srcset: string;
    sizes: string;
    uri: string;
    type: 'srcset';
}
type UseSourceSelectionReturn = {
    containerRef: (element: HTMLDivElement) => void;
    source: ImageSource | SrcSetSource | null;
};
export default function useSourceSelection(sources?: ImageSource[], responsivePolicy?: ImageProps['responsivePolicy'], measurementCallback?: (target: HTMLElement, size: DOMRect) => void): UseSourceSelectionReturn;
export {};
//# sourceMappingURL=useSourceSelection.d.ts.map