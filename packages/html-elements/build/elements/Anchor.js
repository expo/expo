import React, { forwardRef } from 'react';
import { StyleSheet, Linking, Platform } from 'react-native';
import Text from '../primitives/Text';
import { em } from '../css/units';
export const A = forwardRef(({ href, target, ...props }, ref) => {
    const nativeProps = Platform.select({
        web: {
            href,
            target,
        },
        default: {
            onPress: event => {
                props.onPress && props.onPress(event);
                if (Platform.OS !== 'web' && href !== undefined) {
                    Linking.openURL(href);
                }
            },
        },
    });
    return (<Text accessibilityRole="link" {...props} style={[styles.a, props.style]} {...nativeProps} ref={ref}/>);
});
const styles = StyleSheet.create({
    // @ts-ignore: string isn't supported
    a: {
        fontSize: em(1),
    },
});
//# sourceMappingURL=Anchor.js.map