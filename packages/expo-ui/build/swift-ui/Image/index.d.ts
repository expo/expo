import { ColorValue } from 'react-native';
import { type SFSymbol } from 'sf-symbols-typescript';
import { type CommonViewModifierProps } from '../types';
export interface ImageProps extends CommonViewModifierProps {
    /**
     * The name of the system image (SF Symbol).
     * For example: 'photo', 'heart.fill', 'star.circle'
     */
    systemName: SFSymbol;
    /**
     * The size of the system image.
     */
    size?: number;
    /**
     * The color of the system image.
     * Can be a color name like '#ff00ff', 'red', 'blue', etc.
     */
    color?: ColorValue;
    /**
     * Callback triggered when the view is pressed.
     */
    onPress?: () => void;
}
export declare function Image(props: ImageProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map