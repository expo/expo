/**
 * Plain-object factories for `<List.LazyForEach />`.
 *
 * These build a serializable view-descriptor tree the native side walks into real
 * SwiftUI views. Unlike the eager components (which mount per-row React + native
 * subviews), each row here costs only a JS object — SwiftUI's `List` lazy-instantiates
 * cells from the descriptor array, so total work is O(visible) instead of O(total).
 *
 * Trade-off: the lazy path is a closed DSL — only these factories are accepted, no
 * hooks, no third-party components, no JS-closure event handlers.
 */
export type LazyFont = 'largeTitle' | 'title' | 'title2' | 'title3' | 'headline' | 'subheadline' | 'body' | 'callout' | 'footnote' | 'caption' | 'caption2';
export type LazyColor = 'primary' | 'secondary' | 'red' | 'orange' | 'yellow' | 'green' | 'mint' | 'teal' | 'cyan' | 'blue' | 'indigo' | 'purple' | 'pink' | 'brown' | 'black' | 'white' | 'gray';
type WithId = {
    id?: string;
};
export type LazyTextDescriptor = WithId & {
    type: 'Text';
    value: string;
    font?: LazyFont;
    foregroundColor?: LazyColor;
};
export type LazyImageDescriptor = WithId & {
    type: 'Image';
    systemName: string;
    foregroundColor?: LazyColor;
};
export type LazyHStackDescriptor = WithId & {
    type: 'HStack';
    spacing?: number;
    children: LazyDescriptor[];
};
export type LazyVStackDescriptor = WithId & {
    type: 'VStack';
    spacing?: number;
    children: LazyDescriptor[];
};
export type LazyDescriptor = LazyTextDescriptor | LazyImageDescriptor | LazyHStackDescriptor | LazyVStackDescriptor;
export declare const Lazy: {
    Text(props: Omit<LazyTextDescriptor, "type">): LazyTextDescriptor;
    Image(props: Omit<LazyImageDescriptor, "type">): LazyImageDescriptor;
    HStack(props: Omit<LazyHStackDescriptor, "type">): LazyHStackDescriptor;
    VStack(props: Omit<LazyVStackDescriptor, "type">): LazyVStackDescriptor;
};
export {};
//# sourceMappingURL=index.d.ts.map