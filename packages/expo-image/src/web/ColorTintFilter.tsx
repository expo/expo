import React from 'react';
import { StyleSheet } from 'react-native';

export function getTintColorStyle(tintId: string, tintColor?: string | null) {
  if (!tintColor) {
    return {};
  }
  return {
    filter: `url(#expo-image-tint-${tintId})`,
  };
}

type TintColorFilterProps = { id: string; tintColor?: string | null };

export default function TintColorFilter({ id, tintColor }: TintColorFilterProps) {
  if (!tintColor) {
    return null;
  }
  return (
    <svg style={styles.svg}>
      <defs>
        <filter id={`expo-image-tint-${id}`}>
          <feFlood floodColor={tintColor} />
          <feComposite in2="SourceAlpha" operator="atop" />
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
