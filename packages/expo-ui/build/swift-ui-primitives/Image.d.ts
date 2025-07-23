import { type CommonViewModifierProps } from './types';
export interface ImageProps extends CommonViewModifierProps {
    /**
     * The name of the system image (SF Symbol).
     * For example: 'photo', 'heart.fill', 'star.circle'
     */
    systemName: string;
    /**
     * The size of the system image.
     */
    size?: number;
    /**
     * The color of the system image.
     * Can be a color name like '#ff00ff', 'red', 'blue', etc.
     */
    color?: string;
    /**
     * Callback triggered when the view is pressed.
     */
    onPress?: () => void;
}
export declare function Image(props: ImageProps): import("react").JSX.Element;
//# sourceMappingURL=Image.d.ts.map