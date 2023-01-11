import { ImageProps, ImageSource } from '../Image.types';
export default function useSourceSelection(sources?: ImageSource[], sizeCalculation?: ImageProps['responsivePolicy'], measurementCallback?: (target: HTMLElement, size: DOMRect) => void): {
    containerRef: (element: HTMLDivElement) => void;
    source: ImageSource | null;
};
//# sourceMappingURL=useSourceSelection.d.ts.map