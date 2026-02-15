import React from 'react';
import { ExpoModifier } from '../../types';
export type SectionProps = {
    /**
     * The children of the `Section` component.
     */
    children: React.ReactNode;
    /**
     * Title displayed in the section header.
     */
    title?: string;
    /**
     * Whether the section content is expanded (visible).
     * @default true
     */
    isExpanded?: boolean;
    /**
     * Callback fired when the expand/collapse state changes.
     */
    onIsExpandedChange?: (isExpanded: boolean) => void;
    /**
     * Background color of the section card.
     */
    containerColor?: string;
    /**
     * Color of the title text.
     */
    titleColor?: string;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
export declare function Section(props: SectionProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map