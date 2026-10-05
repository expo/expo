import { type CommonViewModifierProps } from '../types';
export interface ArrangementViewProps extends CommonViewModifierProps {
    /**
     * The views to arrange. Provide `ArrangementView.Primary` and `ArrangementView.Secondary`.
     */
    children: React.ReactNode;
}
/**
 * The primary view of the arrangement.
 */
declare function ArrangementViewPrimary(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * The secondary view of the arrangement.
 */
declare function ArrangementViewSecondary(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * ArrangementView uses the native [ArrangementView](https://developer.apple.com/documentation/swiftui/arrangementview) view.
 *
 * A view that arranges primary and secondary content using an adaptive layout that responds to
 * the environment.
 *
 * > **Note:** Below iOS 27.1, the children render without a container.
 * @example
 * ```tsx
 * <Host style={{ flex: 1 }}>
 *   <ArrangementView modifiers={[arrangementViewStyle('split')]}>
 *     <ArrangementView.Primary>
 *       <NowPlaying />
 *     </ArrangementView.Primary>
 *     <ArrangementView.Secondary>
 *       <Lyrics />
 *     </ArrangementView.Secondary>
 *   </ArrangementView>
 * </Host>
 * ```
 * @platform ios 27.1+
 * @platform tvos 27.1+
 */
export declare function ArrangementView(props: ArrangementViewProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ArrangementView {
    var Primary: typeof ArrangementViewPrimary;
    var Secondary: typeof ArrangementViewSecondary;
}
export {};
//# sourceMappingURL=index.d.ts.map