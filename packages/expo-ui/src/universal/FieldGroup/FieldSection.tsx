import { Fragment } from 'react';
import { Text, useColorScheme, View, type TextStyle, type ViewStyle } from 'react-native';

import { extractFieldSectionSlots } from './FieldSectionSlots';
import type { FieldSectionProps } from './types';
import { useUniversalLifecycle } from '../hooks';

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

  const containerStyle: ViewStyle = {
    ...style,
    ...(hidden ? { display: 'none' } : undefined),
  };

  const headerNode =
    header ??
    (title ? (
      <Text
        style={[
          headerTextStyle,
          isDarkScheme ? headerTextDarkStyle : headerTextLightStyle,
          titleUppercase ? headerTextUppercaseStyle : null,
        ]}>
        {title}
      </Text>
    ) : null);

  return (
    <View style={containerStyle} testID={testID}>
      {headerNode ? <View style={headerContainerStyle}>{headerNode}</View> : null}
      {rows.length > 0 ? (
        <View style={[cardBaseStyle, isDarkScheme ? cardDarkStyle : cardLightStyle]}>
          {rows.map((child, index) => (
            <Fragment key={index}>
              <View style={rowWrapperStyle}>{child}</View>
              {index < rows.length - 1 ? (
                <View style={[dividerStyle, isDarkScheme ? dividerDarkStyle : dividerLightStyle]} />
              ) : null}
            </Fragment>
          ))}
        </View>
      ) : null}
      {footer ? <View style={footerContainerStyle}>{footer}</View> : null}
    </View>
  );
}

const headerContainerStyle: ViewStyle = {
  paddingHorizontal: 16,
  paddingBottom: 8,
};

const headerTextStyle: TextStyle = {
  fontSize: 14,
  fontWeight: '500',
};

const headerTextLightStyle: TextStyle = {
  color: '#6c6c70',
};

const headerTextDarkStyle: TextStyle = {
  color: '#98989e',
};

const headerTextUppercaseStyle: TextStyle = {
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  fontSize: 13,
};

const cardBaseStyle: ViewStyle = {
  borderRadius: 12,
  overflow: 'hidden',
};

const cardLightStyle: ViewStyle = {
  backgroundColor: '#ffffff',
};

const cardDarkStyle: ViewStyle = {
  backgroundColor: '#1c1c1e',
};

// Gives each row the same minimum height SwiftUI `Form` uses for single-line
// rows on iOS, so a text-only row doesn't collapse to its text intrinsic
// size. Taller content (e.g. a Switch) grows the row naturally. Horizontal
// padding matches SwiftUI `Form`'s built-in row leading/trailing inset.
const rowWrapperStyle: ViewStyle = {
  minHeight: 44,
  justifyContent: 'center',
  paddingHorizontal: 16,
};

const dividerStyle: ViewStyle = {
  height: 1,
  marginLeft: 16,
};

const dividerLightStyle: ViewStyle = {
  backgroundColor: '#e5e5ea',
};

const dividerDarkStyle: ViewStyle = {
  backgroundColor: '#38383a',
};

const footerContainerStyle: ViewStyle = {
  paddingHorizontal: 16,
  paddingTop: 8,
};
