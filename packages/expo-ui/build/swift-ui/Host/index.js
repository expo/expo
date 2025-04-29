import { requireNativeView } from 'expo';
import { useState } from 'react';
const HostNativeView = requireNativeView('ExpoUI', 'HostView');
/**
 * A hosting component for SwiftUI views.
 */
export function Host(props) {
    const { matchContents, useViewportSizeMeasurement, onLayoutContent, style, ...restProps } = props;
    const [containerStyle, setContainerStyle] = useState(null);
    return (<HostNativeView onLayoutContent={(e) => {
            onLayoutContent?.(e);
            if (matchContents) {
                setContainerStyle({
                    width: e.nativeEvent.width,
                    height: e.nativeEvent.height,
                });
            }
        }} style={[style, containerStyle]} matchContents={matchContents} useViewportSizeMeasurement={useViewportSizeMeasurement} {...restProps}/>);
}
//# sourceMappingURL=index.js.map