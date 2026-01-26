import * as React from 'react';
import { type CommonViewModifierProps } from '../types';
export interface TextProps extends CommonViewModifierProps {
    /**
     * Text content or nested Text components.
     */
    children?: React.ReactNode;
    /**
     * Enables Markdown formatting for the text content using SwiftUI LocalizedStringKey.
     */
    markdownEnabled?: boolean;
}
export declare function Text(props: TextProps): React.JSX.Element | null;
//# sourceMappingURL=index.d.ts.map