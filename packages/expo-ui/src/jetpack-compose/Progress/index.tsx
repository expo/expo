import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Stroke cap style for progress indicators.
 */
export type StrokeCap = 'round' | 'butt' | 'square';

function transformProps<T extends { modifiers?: ModifierConfig[] }>(props: T): T {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  } as T;
}

function createProgressComponent<P extends { modifiers?: ModifierConfig[] }>(
  viewName: string
): React.ComponentType<P> {
  const NativeView: React.ComponentType<P> = requireNativeView('ExpoUI', viewName);
  return function ProgressComponent(props: P) {
    return <NativeView {...transformProps(props)} />;
  };
}

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

/**
 * A linear progress indicator that displays progress in a horizontal bar.
 *
 * Matches the Jetpack Compose `LinearProgressIndicator`.
 */
export const LinearProgressIndicator =
  createProgressComponent<LinearProgressIndicatorProps>('LinearProgressIndicatorView');

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

/**
 * A circular progress indicator that displays progress in a circular format.
 *
 * Matches the Jetpack Compose `CircularProgressIndicator`.
 */
export const CircularProgressIndicator =
  createProgressComponent<CircularProgressIndicatorProps>('CircularProgressIndicatorView');

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

/**
 * A linear progress indicator with wavy animation style.
 *
 * Matches the Jetpack Compose `LinearWavyProgressIndicator`.
 */
export const LinearWavyProgressIndicator =
  createProgressComponent<LinearWavyProgressIndicatorProps>('LinearWavyProgressIndicatorView');

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

/**
 * A circular progress indicator with wavy animation style.
 *
 * Matches the Jetpack Compose `CircularWavyProgressIndicator`.
 */
export const CircularWavyProgressIndicator =
  createProgressComponent<CircularWavyProgressIndicatorProps>('CircularWavyProgressIndicatorView');

// endregion
