import { type CommonViewModifierProps } from '../types';
export type LabeledContentProps = {
    /**
     * The label to be displayed in the labeled content.
     */
    label?: string;
    children: React.ReactNode;
} & CommonViewModifierProps;
/**
 * LabeledContent component uses the native [LabeledContent](https://developer.apple.com/documentation/swiftui/labeledcontent) component.
 * A container for attaching a label to a value-bearing view.
 * @platform ios 16.0+
 * @platform tvos 16.0+
 */
export declare function LabeledContent(props: LabeledContentProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map