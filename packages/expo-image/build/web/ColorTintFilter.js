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
    return (<svg style={styles.svg}>
      <defs>
        <filter id={`expo-image-tint-${tintColor}`} x="0" y="0" width="0" height="0">
          <feFlood floodColor={tintColor} floodOpacity="1" result="flood"/>
          <feComposite in="flood" in2="SourceAlpha" operator="in"/>
        </filter>
      </defs>
    </svg>);
}
const styles = StyleSheet.create({
    svg: {
        width: 0,
        height: 0,
    },
});
//# sourceMappingURL=ColorTintFilter.js.map