import { requireNativeView } from 'expo';
import { ColorValue } from 'react-native';

import { ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Stroke cap style for progress indicators.
 */
export type StrokeCap = 'round' | 'butt' | 'square';

// region LinearProgressIndicator

export type LinearProgressIndicatorProps = {
  /**
   * The current progress value between `0` and `1`. Omit for indeterminate.
   */
  progress?: number | null;
  /**
   * Progress indicator color.
   */
  color?: ColorValue;
  /**
   * Track (background) color.
   */
  trackColor?: ColorValue;
  /**
   * Stroke cap style for the indicator ends.
   * @default 'round'
   */
  strokeCap?: StrokeCap;
  /**
   * Gap size between the indicator and track in dp.
   */
  gapSize?: number;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

const LinearProgressIndicatorNativeView: React.ComponentType<LinearProgressIndicatorProps> =
  requireNativeView('ExpoUI', 'LinearProgressIndicatorView');

function transformLinearProps(props: LinearProgressIndicatorProps): LinearProgressIndicatorProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A linear progress indicator that displays progress in a horizontal bar.
 *
 * Matches the Jetpack Compose `LinearProgressIndicator`.
 */
export function LinearProgressIndicator(props: LinearProgressIndicatorProps) {
  return <LinearProgressIndicatorNativeView {...transformLinearProps(props)} />;
}

// endregion

// region CircularProgressIndicator

export type CircularProgressIndicatorProps = {
  /**
   * The current progress value between `0` and `1`. Omit for indeterminate.
   */
  progress?: number | null;
  /**
   * Progress indicator color.
   */
  color?: ColorValue;
  /**
   * Track (background) color.
   */
  trackColor?: ColorValue;
  /**
   * Width of the circular stroke in dp.
   */
  strokeWidth?: number;
  /**
   * Stroke cap style for the indicator ends.
   * @default 'round'
   */
  strokeCap?: StrokeCap;
  /**
   * Gap size between the indicator and track in dp.
   */
  gapSize?: number;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

const CircularProgressIndicatorNativeView: React.ComponentType<CircularProgressIndicatorProps> =
  requireNativeView('ExpoUI', 'CircularProgressIndicatorView');

function transformCircularProps(
  props: CircularProgressIndicatorProps
): CircularProgressIndicatorProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A circular progress indicator that displays progress in a circular format.
 *
 * Matches the Jetpack Compose `CircularProgressIndicator`.
 */
export function CircularProgressIndicator(props: CircularProgressIndicatorProps) {
  return <CircularProgressIndicatorNativeView {...transformCircularProps(props)} />;
}

// endregion

// region LinearWavyProgressIndicator

export type LinearWavyProgressIndicatorProps = {
  /**
   * The current progress value between `0` and `1`. Omit for indeterminate.
   */
  progress?: number | null;
  /**
   * Progress indicator color.
   */
  color?: ColorValue;
  /**
   * Track (background) color.
   */
  trackColor?: ColorValue;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

const LinearWavyProgressIndicatorNativeView: React.ComponentType<LinearWavyProgressIndicatorProps> =
  requireNativeView('ExpoUI', 'LinearWavyProgressIndicatorView');

function transformLinearWavyProps(
  props: LinearWavyProgressIndicatorProps
): LinearWavyProgressIndicatorProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A linear progress indicator with wavy animation style.
 *
 * Matches the Jetpack Compose `LinearWavyProgressIndicator`.
 */
export function LinearWavyProgressIndicator(props: LinearWavyProgressIndicatorProps) {
  return <LinearWavyProgressIndicatorNativeView {...transformLinearWavyProps(props)} />;
}

// endregion

// region CircularWavyProgressIndicator

export type CircularWavyProgressIndicatorProps = {
  /**
   * The current progress value between `0` and `1`. Omit for indeterminate.
   */
  progress?: number | null;
  /**
   * Progress indicator color.
   */
  color?: ColorValue;
  /**
   * Track (background) color.
   */
  trackColor?: ColorValue;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

const CircularWavyProgressIndicatorNativeView: React.ComponentType<CircularWavyProgressIndicatorProps> =
  requireNativeView('ExpoUI', 'CircularWavyProgressIndicatorView');

function transformCircularWavyProps(
  props: CircularWavyProgressIndicatorProps
): CircularWavyProgressIndicatorProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A circular progress indicator with wavy animation style.
 *
 * Matches the Jetpack Compose `CircularWavyProgressIndicator`.
 */
export function CircularWavyProgressIndicator(props: CircularWavyProgressIndicatorProps) {
  return <CircularWavyProgressIndicatorNativeView {...transformCircularWavyProps(props)} />;
}

// endregion
