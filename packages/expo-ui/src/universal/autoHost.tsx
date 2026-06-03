import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Host } from './Host';
import type { UniversalHostProps } from './Host/types';
import { useIsInsideNativeHost } from './hostContext';

export type AutoHostOptions = Pick<
  UniversalHostProps,
  'matchContents' | 'style' | 'useViewportSizeMeasurement'
>;

export type EnsureHostProps = AutoHostOptions & {
  children?: ReactNode;
};

const hostStyles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
});

const hostSizingStyleKeys = [
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'aspectRatio',
] as const;

const horizontalHostSizingStyleKeys = [
  'width',
  'minWidth',
  'maxWidth',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'aspectRatio',
] as const;

const verticalHostSizingStyleKeys = [
  'height',
  'minHeight',
  'maxHeight',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'aspectRatio',
] as const;

export const intrinsicHostOptions: AutoHostOptions = {
  matchContents: true,
};

export function copyHostSizingStyle(
  style?: StyleProp<ViewStyle>
): StyleProp<ViewStyle> | undefined {
  const flatStyle = StyleSheet.flatten(style);

  if (!flatStyle) {
    return undefined;
  }

  const hostStyle: ViewStyle = {};

  for (const key of hostSizingStyleKeys) {
    const value = flatStyle[key];
    if (value != null) {
      (hostStyle as Record<string, unknown>)[key] = value;
    }
  }

  return Object.keys(hostStyle).length > 0 ? hostStyle : undefined;
}

export function layoutHostOptions(style?: StyleProp<ViewStyle>): AutoHostOptions {
  const flatStyle = StyleSheet.flatten(style);
  const hostStyle = copyHostSizingStyle(style);

  if (!hostStyle || !flatStyle) {
    return intrinsicHostOptions;
  }

  const hasHorizontalSizing = horizontalHostSizingStyleKeys.some((key) => flatStyle[key] != null);
  const hasVerticalSizing = verticalHostSizingStyleKeys.some((key) => flatStyle[key] != null);
  const matchContents =
    hasHorizontalSizing && hasVerticalSizing
      ? undefined
      : {
          horizontal: !hasHorizontalSizing,
          vertical: !hasVerticalSizing,
        };

  return matchContents ? { matchContents, style: hostStyle } : { style: hostStyle };
}

export function fullHostOptions(style?: StyleProp<ViewStyle>): AutoHostOptions {
  return {
    style: [hostStyles.fill, copyHostSizingStyle(style)],
    useViewportSizeMeasurement: true,
  };
}

export function verticalContentHostOptions(style?: StyleProp<ViewStyle>): AutoHostOptions {
  return {
    matchContents: { vertical: true },
    style: [hostStyles.fullWidth, copyHostSizingStyle(style)],
  };
}

export function EnsureHost({ children, ...hostProps }: EnsureHostProps) {
  const isInsideNativeHost = useIsInsideNativeHost();

  if (isInsideNativeHost) {
    return <>{children}</>;
  }

  return <Host {...hostProps}>{children}</Host>;
}
