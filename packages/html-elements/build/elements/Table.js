import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { em } from '../css/units';
import { TableText } from '../primitives/Table';
import Text from '../primitives/Text';
import View from '../primitives/View';
export const Table = forwardRef((props, ref) => {
    return React.createElement(View, { ...props, ref: ref });
});
export const THead = forwardRef((props, ref) => {
    return React.createElement(View, { ...props, ref: ref });
});
export const TBody = forwardRef((props, ref) => {
    return React.createElement(View, { ...props, ref: ref });
});
export const TFoot = forwardRef((props, ref) => {
    return React.createElement(View, { ...props, ref: ref });
});
export const TH = forwardRef((props, ref) => {
    return React.createElement(TableText, { ...props, style: [styles.th, props.style], ref: ref });
});
export const TR = forwardRef((props, ref) => {
    return React.createElement(View, { ...props, style: [styles.tr, props.style], ref: ref });
});
export const TD = forwardRef((props, ref) => {
    return React.createElement(TableText, { ...props, style: [styles.td, props.style], ref: ref });
});
export const Caption = forwardRef((props, ref) => {
    return React.createElement(Text, { ...props, style: [styles.caption, props.style], ref: ref });
});
const styles = StyleSheet.create({
    caption: {
        textAlign: 'center',
        fontSize: em(1),
    },
    th: {
        textAlign: 'center',
        fontWeight: 'bold',
        flex: 1,
        fontSize: em(1),
    },
    tr: {
        flexDirection: 'row',
    },
    td: {
        flex: 1,
        fontSize: em(1),
    },
});
//# sourceMappingURL=Table.js.map