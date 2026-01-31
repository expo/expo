import { requireNativeView } from 'expo';
import React from 'react';
import { type ColorValue } from 'react-native';

import { type ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type SurfaceProps = {
  /**
   * The content to display inside the surface.
   */
  children?: React.ReactNode;
  /**
   * The background color of the surface.
   * Defaults to `MaterialTheme.colorScheme.surface`.
   */
  color?: ColorValue;
  /**
   * The color of the content inside the surface.
   * Defaults to `contentColorFor(color)`.
   */
  contentColor?: ColorValue;
  /**
   * The tonal elevation of the surface, which affects its background color
   * based on the color scheme. Value in dp.
   *
   * @default 0
   */
  tonalElevation?: number;
  /**
   * The shadow elevation of the surface. Value in dp.
   *
   * @default 0
   */
  shadowElevation?: number;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeSurfaceProps = SurfaceProps;

const SurfaceNativeView: React.ComponentType<NativeSurfaceProps> = requireNativeView(
  'ExpoUI',
  'SurfaceView'
);

function transformProps(props: SurfaceProps): NativeSurfaceProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A Material Design surface container. Surface is responsible for:
 * - Clipping content to the shape
 * - Applying background color based on tonal elevation
 * - Providing content color to its children
 */
export function Surface(props: SurfaceProps) {
  return <SurfaceNativeView {...transformProps(props)} />;
}
