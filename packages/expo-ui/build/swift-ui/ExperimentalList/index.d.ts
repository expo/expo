export type FontToken = 'largeTitle' | 'title' | 'title2' | 'title3' | 'headline' | 'subheadline' | 'body' | 'callout' | 'caption' | 'caption2' | 'footnote';
export type FontWeightToken = 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';
export type ViewDescription = {
    type: 'VStack' | 'HStack';
    alignment?: 'leading' | 'center' | 'trailing' | 'top' | 'bottom';
    spacing?: number;
    children: ViewDescription[];
} | {
    type: 'Text';
    text: string;
    font?: FontToken;
    weight?: FontWeightToken;
    foregroundColor?: string;
} | {
    type: 'Image';
    systemImage: string;
    foregroundColor?: string;
} | {
    type: 'Spacer';
};
export type ExperimentalListRenderItem<T> = (item: T, index: number) => ViewDescription;
export type ExperimentalListProps<T> = {
    data: readonly T[];
    renderItem: ExperimentalListRenderItem<T>;
    spacing?: number;
};
export declare function ExperimentalList<T>({ data, renderItem, spacing }: ExperimentalListProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map