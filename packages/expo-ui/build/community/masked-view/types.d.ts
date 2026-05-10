import type { ReactElement, ReactNode } from 'react';
import type { ViewProps } from 'react-native';
/**
 * Drop-in props for `@react-native-masked-view/masked-view`'s `MaskedView`.
 *
 * @see https://github.com/callstack/masked-view
 */
export interface MaskedViewProps extends ViewProps {
    /**
     * The element used as the mask. Only opaque pixels of `maskElement` make the
     * masked content visible — transparent pixels hide it.
     */
    maskElement: ReactElement;
    /**
     * Content rendered behind the mask.
     */
    children?: ReactNode;
}
//# sourceMappingURL=types.d.ts.map