import { Fragment } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { extractFieldSectionSlots } from './FieldSectionSlots';
import type { FieldSectionProps } from './types';
import { useUniversalLifecycle } from '../hooks';

const styles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerText: {
    color: '#6c6c70',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTextDark: {
    color: '#98989e',
  },
  headerTextUppercase: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 13,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#1c1c1e',
  },
  // Gives each row the same minimum height SwiftUI `Form` uses for single-line
  // rows on iOS, so a text-only row doesn't collapse to its text intrinsic
  // size. Taller content (e.g. a Switch) grows the row naturally. Horizontal
  // padding matches SwiftUI `Form`'s built-in row leading/trailing inset.
  rowWrapper: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  divider: {
    backgroundColor: '#e5e5ea',
    height: 1,
    marginLeft: 16,
  },
  dividerDark: {
    backgroundColor: '#38383a',
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});

/**
 * A grouped list of rows within a [`FieldGroup`](#fieldgroup). Each direct
 * child is rendered as a single row. Use `title` for a simple caption header,
 * or nest a `<FieldGroup.SectionHeader>` / `<FieldGroup.SectionFooter>`
 * child for fully custom header / footer content.
 */
export function FieldSection({
  children,
  title,
  style,
  onAppear,
  onDisappear,
  hidden,
  testID,
  titleUppercase = false,
}: FieldSectionProps) {
  useUniversalLifecycle(onAppear, onDisappear);

  const isDarkScheme = useColorScheme() === 'dark';

  const { header, footer, rows } = extractFieldSectionSlots(children);

  const headerNode =
    header ??
    (title ? (
      <Text
        style={[
          styles.headerText,
          isDarkScheme && styles.headerTextDark,
          titleUppercase && styles.headerTextUppercase,
        ]}>
        {title}
      </Text>
    ) : null);

  return (
    <View style={[style, hidden && styles.hidden]} testID={testID}>
      {headerNode ? <View style={styles.headerContainer}>{headerNode}</View> : null}
      {rows.length > 0 ? (
        <View style={[styles.card, isDarkScheme && styles.cardDark]}>
          {rows.map((child, index) => (
            <Fragment key={index}>
              <View style={styles.rowWrapper}>{child}</View>
              {index < rows.length - 1 ? (
                <View style={[styles.divider, isDarkScheme && styles.dividerDark]} />
              ) : null}
            </Fragment>
          ))}
        </View>
      ) : null}
      {footer ? <View style={styles.footerContainer}>{footer}</View> : null}
    </View>
  );
}
