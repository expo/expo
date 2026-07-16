import { type Alignment, type CommonViewModifierProps } from '../types';
export type BackgroundProps = {
    /**
     * The foreground content. Provide the background view via `Background.Content`.
     *
     * Maps to SwiftUI's `.background(alignment:content:)`: the `Background.Content` is drawn behind
     * the foreground and is sized to it, so a full-bleed background image does not expand or
     * compress the foreground (unlike a `ZStack`). This makes it the correct primitive for widget
     * and Live Activity backgrounds.
     */
    children: React.ReactNode;
    /**
     * The alignment of the background content relative to the foreground content.
     * @default 'center'
     */
    alignment?: Alignment;
} & CommonViewModifierProps;
declare function BackgroundContent(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function Background(props: BackgroundProps): import("react/jsx-runtime").JSX.Element;
export declare namespace Background {
    var Content: typeof BackgroundContent;
}
export {};
//# sourceMappingURL=index.d.ts.map