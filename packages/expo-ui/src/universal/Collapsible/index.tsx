import { useId, type ComponentProps } from 'react';
import { StyleSheet, Text, unstable_createElement, View, type ViewProps } from 'react-native';

import type { CollapsibleProps } from './types';

const SummaryButton = (
  props: Omit<ComponentProps<'button'>, 'style' | 'type'> & { style?: ViewProps['style'] }
) => unstable_createElement('button', { ...props, type: 'button' });

/**
 * A primitive that toggles visibility of its content via a labelled tappable
 * header. Controlled via `isOpen` + `onOpenChange`.
 */
export function Collapsible({ isOpen, onOpenChange, label = '', children }: CollapsibleProps) {
  const contentId = useId();

  return (
    <View style={styles.container}>
      <SummaryButton
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => onOpenChange(!isOpen)}
        style={styles.summary}>
        <Text>{label}</Text>
        <Text aria-hidden style={[styles.chevron, isOpen && styles.chevronOpen]}>
          ▾
        </Text>
      </SummaryButton>
      <View
        id={contentId}
        role="region"
        aria-hidden={!isOpen}
        style={[styles.gridWrapper, isOpen ? styles.gridOpen : styles.gridClosed]}>
        <View style={styles.gridInner}>
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '100%',
  },
  summary: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    userSelect: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: 'inherit',
    // @ts-expect-error
    fontSize: 'inherit',
  },
  chevron: {
    // @ts-expect-error
    display: 'inline-block',
    fontSize: 24,
    transform: [{ rotate: '0deg' }],
    transition: 'transform 200ms ease',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  // Grid-row trick: animate `auto`-sized content height by transitioning the
  // implicit row from `0fr` to `1fr`.
  // The inner element needs `overflow: hidden` + `min-height: 0` so it actually collapses when the row is 0fr.
  gridWrapper: {
    // @ts-expect-error
    display: 'grid',
    transition: 'grid-template-rows 200ms ease',
  },
  gridClosed: {
    // @ts-expect-error
    gridTemplateRows: '0fr',
  },
  gridOpen: {
    // @ts-expect-error
    gridTemplateRows: '1fr',
  },
  gridInner: {
    overflow: 'hidden',
    minHeight: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});

export * from './types';
