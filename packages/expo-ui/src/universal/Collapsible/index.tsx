import type { ComponentProps, SyntheticEvent } from 'react';
import {
  StyleSheet,
  Text,
  unstable_createElement,
  useColorScheme,
  View,
  type TextProps,
  type ViewProps,
} from 'react-native';

import type { CollapsibleProps } from './types';

const Details = (
  props: Omit<ComponentProps<'details'>, 'style'> & { style?: TextProps['style'] }
) => unstable_createElement('details', props);

const Summary = (
  props: Omit<ComponentProps<'summary'>, 'style'> & { style?: ViewProps['style'] }
) => unstable_createElement('summary', props);

/**
 * A primitive that toggles visibility of its content via a labelled tappable
 * header. Controlled via `isOpen` + `onOpenChange`.
 */
export function Collapsible({ isOpen, onOpenChange, label = '', children }: CollapsibleProps) {
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
        <Text style={isDark && styles.darkText}>{label}</Text>
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
