import React from 'react';
import { StyleSheet } from 'react-native';

export function getColorTintStyle(tintColor?: string | null) {
  if (!tintColor) return {};
  return {
    filter: `url(#tint-${tintColor})`,
  };
}

export default function ColorTintFilter({ tintColor }: { tintColor?: string | null }) {
  if (!tintColor) {
    return null;
  }
  return (
    <svg style={styles.svg}>
      <defs>
        <filter id={`tint-${tintColor}`} x="0" y="0" width="0" height="0">
          <feFlood floodColor={tintColor} floodOpacity="1" result="flood" />
          <feComposite in="flood" in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    width: 0,
    height: 0,
  },
});
