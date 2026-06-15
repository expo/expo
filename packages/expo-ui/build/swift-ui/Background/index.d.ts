import { type Alignment, type CommonViewModifierProps } from '../types';
export type BackgroundProps = {
    /**
     * The foreground content, followed by a single background view as the LAST child.
     *
     * Maps to SwiftUI's `.background(alignment:content:)`: the background is drawn behind the
     * foreground and is sized to it, so a full-bleed background image does not expand or compress
     * the foreground (unlike a `ZStack`). This makes it the correct primitive for widget and Live
     * Activity backgrounds.
     */
    children: React.ReactNode;
    /**
     * The alignment of the background content relative to the foreground content.
     * @default 'center'
     */
    alignment?: Alignment;
} & CommonViewModifierProps;
export declare function Background(props: BackgroundProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map