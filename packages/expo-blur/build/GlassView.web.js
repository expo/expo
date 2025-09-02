// Copyright © 2024 650 Industries.
'use client';
import React from 'react';
import { View, StyleSheet } from 'react-native';
export default class GlassView extends React.Component {
    render() {
        const { style, children, ...props } = this.props;
        // Web fallback: render a transparent view without glass effect
        return (<View {...props} style={[styles.container, style]}>
        {children}
      </View>);
    }
}
const styles = StyleSheet.create({
    container: { backgroundColor: 'transparent' },
});
//# sourceMappingURL=GlassView.web.js.map