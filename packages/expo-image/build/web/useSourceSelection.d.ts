import { ImageProps, ImageSource } from '../Image.types';
export default function useSourceSelection(sources?: ImageSource[], sizeCalculation?: ImageProps['responsivePolicy']): {
    containerRef: (element: HTMLDivElement) => void;
    source: ImageSource | null;
};
//# sourceMappingURL=useSourceSelection.d.ts.map