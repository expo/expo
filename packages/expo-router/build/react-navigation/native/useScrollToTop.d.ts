import * as React from 'react';
import type { ScrollView } from 'react-native';
type ScrollOptions = {
    x?: number;
    y?: number;
    animated?: boolean;
};
type ScrollableView = {
    scrollToTop(): void;
} | {
    scrollTo(options: ScrollOptions): void;
} | {
    scrollToOffset(options: {
        offset: number;
        animated?: boolean;
    }): void;
} | {
    scrollResponderScrollTo(options: ScrollOptions): void;
};
type ScrollableWrapper = {
    getScrollResponder(): React.ReactNode | ScrollView;
} | {
    getNode(): ScrollableView;
} | ScrollableView | null;
export declare function useScrollToTop(ref: React.RefObject<ScrollableWrapper>): void;
export {};
//# sourceMappingURL=useScrollToTop.d.ts.map