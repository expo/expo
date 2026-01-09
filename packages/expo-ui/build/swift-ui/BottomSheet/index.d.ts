import { type CommonViewModifierProps } from '../types';
export type BottomSheetProps = {
    /**
     * The children of the `BottomSheet` component.
     * Use `BottomSheet.Content` to wrap your content and apply presentation modifiers
     * like `presentationDetents`, `presentationDragIndicator`,
     * `presentationBackgroundInteraction`, and `interactiveDismissDisabled`.
     */
    children: any;
    /**
     * Whether the `BottomSheet` is presented.
     */
    isPresented: boolean;
    /**
     * Callback function that is called when the `BottomSheet` presented state changes.
     */
    onIsPresentedChange: (isPresented: boolean) => void;
    /**
     * When `true`, the sheet will automatically size itself to fit its content.
     * This sets the presentation detent to match the height of the children.
     * @default false
     */
    fitToContents?: boolean;
} & CommonViewModifierProps;
export type BottomSheetContentProps = {
    /**
     * The content to display inside the bottom sheet.
     */
    children: React.ReactNode;
} & CommonViewModifierProps;
/**
 * `BottomSheet` presents content from the bottom of the screen.
 */
declare function BottomSheet(props: BottomSheetProps): import("react").JSX.Element;
declare namespace BottomSheet {
    var Content: (props: BottomSheetContentProps) => import("react").JSX.Element;
}
export { BottomSheet };
//# sourceMappingURL=index.d.ts.map