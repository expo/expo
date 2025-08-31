import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const HostNativeView = requireNativeView('ExpoUI', 'HostView');
/**
 * A hosting component for SwiftUI views.
 */
export function Host(props) {
    const { matchContents, matchContentsVertical, matchContentsHorizontal, onLayoutContent, modifiers, ...restProps } = props;
    const matchContentsVerticalProp = matchContentsVertical ??
        (typeof matchContents === 'object' ? matchContents.vertical : matchContents);
    const matchContentsHorizontalProp = matchContentsHorizontal ??
        (typeof matchContents === 'object' ? matchContents.horizontal : matchContents);
    return (<HostNativeView modifiers={modifiers} matchContentsVertical={matchContentsVerticalProp} matchContentsHorizontal={matchContentsHorizontalProp} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} onLayoutContent={(e) => {
            onLayoutContent?.(e);
        }} {...restProps} 
    // @ts-expect-error
    measureableNode/>);
}
//# sourceMappingURL=index.js.map