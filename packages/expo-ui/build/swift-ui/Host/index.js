import { requireNativeView } from 'expo';
import { useState } from 'react';
import { createViewModifierEventListener } from '../modifiers/utils';
import { markChildrenAsNestedInSwiftUI } from './missingHostUtils';
const HostNativeView = requireNativeView('ExpoUI', 'HostView');
/**
 * A hosting component for SwiftUI views.
 */
export function Host(props) {
    const { matchContents, onLayoutContent, style, modifiers, ...restProps } = props;
    const [containerStyle, setContainerStyle] = useState(null);
    return (<HostNativeView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} style={[style, containerStyle]} onLayoutContent={(e) => {
            onLayoutContent?.(e);
            if (matchContents) {
                const matchVertical = typeof matchContents === 'object' ? matchContents.vertical : matchContents;
                const matchHorizontal = typeof matchContents === 'object' ? matchContents.horizontal : matchContents;
                const newContainerStyle = {};
                if (matchVertical) {
                    newContainerStyle.height = e.nativeEvent.height;
                }
                if (matchHorizontal) {
                    newContainerStyle.width = e.nativeEvent.width;
                }
                setContainerStyle(newContainerStyle);
            }
        }} {...restProps} children={markChildrenAsNestedInSwiftUI(props.children)}/>);
}
export { markChildrenAsNestedInSwiftUI, isMissingHost, MissingHostErrorView, } from './missingHostUtils';
//# sourceMappingURL=index.js.map