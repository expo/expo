import React, { forwardRef } from 'react';
import { Linking, Platform } from 'react-native';
import Text from '../primitives/Text';
export const A = forwardRef(({ href, target, ...props }, ref) => {
    const nativeProps = Platform.select({
        web: {
            href,
            target,
        },
        default: {
            onPress: (event) => {
                props.onPress && props.onPress(event);
                if (Platform.OS !== 'web' && href !== undefined) {
                    Linking.openURL(href);
                }
            },
        },
    });
    return React.createElement(Text, { accessibilityRole: "link", ...props, ...nativeProps, ref: ref });
});
//# sourceMappingURL=Anchor.js.map