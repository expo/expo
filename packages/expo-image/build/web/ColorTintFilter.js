import React from 'react';
import { StyleSheet } from 'react-native';
export function getTintColorStyle(tintColor) {
    if (!tintColor) {
        return {};
    }
    return {
        filter: `url(#expo-image-tint-${tintColor})`,
    };
}
export default function TintColorFilter({ tintColor }) {
    if (!tintColor) {
        return null;
    }
    return (React.createElement("svg", { style: styles.svg },
        React.createElement("defs", null,
            React.createElement("filter", { id: `expo-image-tint-${tintColor}`, x: "0", y: "0", width: "0", height: "0" },
                React.createElement("feFlood", { floodColor: tintColor, floodOpacity: "1", result: "flood" }),
                React.createElement("feComposite", { in: "flood", in2: "SourceAlpha", operator: "in" })))));
}
const styles = StyleSheet.create({
    svg: {
        width: 0,
        height: 0,
    },
});
//# sourceMappingURL=ColorTintFilter.js.map