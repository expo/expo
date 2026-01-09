import { type ColorValue } from 'react-native';
import { ExpoModifier } from '../../types';
export type LoadingIndicatorProps = {
    /**
     * Loading indicator color.
     */
    color?: ColorValue;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
    children?: React.ReactNode;
};
/**
 * Renders a `LoadingIndicator` component.
 * A circular progress indicator typically used to show that an operation is in progress.
 */
export declare function LoadingIndicator(props: LoadingIndicatorProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map