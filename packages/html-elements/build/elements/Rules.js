import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import View from '../primitives/View';
export const Hr = forwardRef((props, ref) => {
    return <View {...props} style={[styles.hr, props.style]} ref={ref}/>;
});
const styles = StyleSheet.create({
    hr: {
        height: 1,
        backgroundColor: '#000000',
    },
});
//# sourceMappingURL=Rules.js.map