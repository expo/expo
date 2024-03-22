// Copyright © 2024 650 Industries.
import React from 'react';
import { StyleSheet, Image, Pressable, Platform } from 'react-native';
const checkmarkBase64 = 'data:image/png;base64,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';
export default function ExpoCheckbox({ color, disabled, onChange, onValueChange, style, value, ...other }) {
    const handleChange = () => {
        onValueChange?.(!value);
    };
    return (<Pressable {...other} disabled={disabled} 
    // Announces "checked" status and "checkbox" as the focused element
    accessibilityRole="checkbox" accessibilityState={{ disabled, checked: value }} style={[
            styles.root,
            style,
            value && styles.checked,
            !!color && { backgroundColor: value ? color : undefined, borderColor: color },
            disabled && styles.disabled,
            value && disabled && styles.checkedAndDisabled,
        ]} onPress={handleChange}>
      {value && (<Image source={{
                uri: checkmarkBase64,
            }} style={StyleSheet.absoluteFill}/>)}
    </Pressable>);
}
const defaultEnabledColor = Platform.select({
    ios: '#007AFF',
    android: '#009688',
});
const defaultGrayColor = '#657786';
const disabledGrayColor = '#CCD6DD';
const disabledCheckedGrayColor = '#AAB8C2';
const styles = StyleSheet.create({
    root: {
        height: 20,
        width: 20,
        borderRadius: 2,
        borderWidth: 2,
        borderColor: defaultGrayColor,
    },
    checked: {
        backgroundColor: defaultEnabledColor,
        borderColor: defaultEnabledColor,
    },
    disabled: {
        borderColor: disabledGrayColor,
        backgroundColor: 'transparent',
    },
    checkedAndDisabled: {
        backgroundColor: disabledCheckedGrayColor,
        borderColor: disabledCheckedGrayColor,
    },
});
//# sourceMappingURL=ExpoCheckbox.js.map