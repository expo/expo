import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useUniversalLifecycle } from '../hooks';
import { colors } from '../webUtils';
import { extractFieldSectionSlots } from './FieldSectionSlots';
import type { FieldSectionProps } from './types';

const styles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerText: {
    color: colors.gray[900],
    fontSize: 14,
    fontWeight: '500',
  },
  headerTextUppercase: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: colors.gray[100],
    overflow: 'hidden',
  },
  // Gives each row the same minimum height SwiftUI `Form` uses for single-line
  // rows on iOS, so a text-only row doesn't collapse to its text intrinsic
  // size. Taller content (e.g. a Switch) grows the row naturally. Horizontal
  // padding matches SwiftUI `Form`'s built-in row leading/trailing inset.
  rowWrapper: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  divider: {
    backgroundColor: colors.gray[100],
    height: 1,
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
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

  const { header, footer, rows } = extractFieldSectionSlots(children);

  const headerNode =
    header ??
    (title ? (
      <Text style={[styles.headerText, titleUppercase && styles.headerTextUppercase]}>{title}</Text>
    ) : null);

  return (
    <View style={[style, hidden && styles.hidden]} testID={testID}>
      {headerNode ? <View style={styles.headerContainer}>{headerNode}</View> : null}
      {rows.length > 0 ? (
        <View style={styles.card}>
          {rows.map((child, index) => (
            <Fragment key={index}>
              <View style={styles.rowWrapper}>{child}</View>
              {index < rows.length - 1 ? <View role="separator" style={styles.divider} /> : null}
            </Fragment>
          ))}
        </View>
      ) : null}
      {footer ? <View style={styles.footerContainer}>{footer}</View> : null}
    </View>
  );
}
