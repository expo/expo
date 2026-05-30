import type { SyntheticEvent } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import type { CollapsibleProps } from './types';
import { createWebComponent } from '../webUtils';

const Details = createWebComponent('details');
const Summary = createWebComponent('summary');

/**
 * A primitive that toggles visibility of its content via a labelled tappable
 * header. Controlled via `isOpen` + `onOpenChange`.
 */
export function Collapsible({
  isOpen,
  onOpenChange,
  label = '',
  labelStyle,
  children,
}: CollapsibleProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Details
      open={isOpen}
      onToggle={(event: SyntheticEvent<HTMLDetailsElement>) => {
        const nextOpen = event.currentTarget.open;
        if (nextOpen !== isOpen) {
          onOpenChange(nextOpen);
        }
      }}
      style={[styles.container, isDark && styles.darkText]}>
      <Summary style={styles.summary}>
        <Text style={[isDark && styles.darkText, labelStyle]}>{label}</Text>
      </Summary>
      <View style={styles.content}>{children}</View>
    </Details>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '100%',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    userSelect: 'none',
    cursor: 'pointer',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  darkText: {
    color: '#fff',
  },
});

export * from './types';
