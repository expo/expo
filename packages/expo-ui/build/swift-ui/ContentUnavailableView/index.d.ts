import { type SFSymbol } from 'sf-symbols-typescript';
import { type CommonViewModifierProps } from '../types';
export interface ContentUnavailableViewProps extends CommonViewModifierProps {
    /**
     * A short title that describes why the content is not available.
     */
    title?: string;
    /**
     * SF Symbol indicating why the content is not available.
     */
    systemImage?: SFSymbol;
    /**
     * Description of why the content is not available.
     */
    description?: string;
}
export declare function ContentUnavailableView(props: ContentUnavailableViewProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map