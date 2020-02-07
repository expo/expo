import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { em } from '../css/units';
import Text from '../primitives/Text';
export const P = forwardRef(({ style, ...props }, ref) => {
    return <Text {...props} style={[styles.p, style]} ref={ref}/>;
});
const styles = StyleSheet.create({
    p: {
        marginVertical: em(1),
        fontSize: em(1),
    },
});
//# sourceMappingURL=Text.js.map