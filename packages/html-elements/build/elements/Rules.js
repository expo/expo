import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import Text from '../primitives/Text';
import View from '../primitives/View';
export const BR = forwardRef((props, ref) => (<Text {...props} ref={ref}>
    {'\n'}
  </Text>));
export const HR = forwardRef((props, ref) => {
    return <View {...props} style={[styles.hr, props.style]} ref={ref}/>;
});
const styles = StyleSheet.create({
    hr: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#9A9A9A',
        borderBottomColor: '#EEEEEE',
        marginVertical: 8,
    },
});
//# sourceMappingURL=Rules.js.map