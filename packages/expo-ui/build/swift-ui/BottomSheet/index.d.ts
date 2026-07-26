import { type ReactNode } from 'react';
import { type CommonViewModifierProps } from '../types';
export interface BottomSheetProps extends CommonViewModifierProps {
    /**
     * The sheet's content, mounted while presented and unmounted after dismiss. Wrap it in `Group`
     * to apply presentation modifiers.
     */
    children: ReactNode;
    /**
     * A view the sheet is anchored to, for example the `Button` that opens it. Rendered in place and
     * kept mounted, so presenting the sheet doesn't shift surrounding layout. Optional.
     */
    anchor?: ReactNode;
    /**
     * Whether the `BottomSheet` is presented.
     */
    isPresented: boolean;
    /**
     * Callback function that is called when the `BottomSheet` presented state changes.
     */
    onIsPresentedChange: (isPresented: boolean) => void;
    /**
     * Callback function that is called after the `BottomSheet` has been fully dismissed.
     */
    onDismiss?: () => void;
    /**
     * When `true`, the sheet will automatically size itself to fit its content.
     * This sets the presentation detent to match the height of the children.
     * @default false
     */
    fitToContents?: boolean;
}
/**
 * `BottomSheet` presents content from the bottom of the screen.
 */
declare function BottomSheet(props: BottomSheetProps): import("react/jsx-runtime").JSX.Element;
export { BottomSheet };
//# sourceMappingURL=index.d.ts.map