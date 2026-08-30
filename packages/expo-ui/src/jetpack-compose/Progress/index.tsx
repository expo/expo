import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Stroke cap style for progress indicators.
 */
export type StrokeCap = 'round' | 'butt' | 'square';

/**
 * Common props shared by all progress indicator variants.
 */
export type ProgressCommonConfig = {
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

function transformProps<T extends ProgressCommonConfig>(props: T): T {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  } as T;
}

function createProgressComponent<P extends ProgressCommonConfig>(
  viewName: string
): React.ComponentType<P> {
  const NativeView: React.ComponentType<P> = requireNativeView('ExpoUI', viewName);
  function Component(props: P) {
    return <NativeView {...transformProps(props)} />;
  }
  Component.displayName = viewName;
  return Component;
}

// region LinearProgressIndicator

/**
 * Configuration for the stop indicator dot at the end of the determinate linear progress track.
 * When provided, draws a stop indicator with the given options. Omit to use the Compose default.
 */
export type DrawStopIndicatorConfig = {
  /**
   * Color of the stop indicator. Defaults to the indicator's color.
   */
  color?: ColorValue;
  /**
   * Stroke cap style for the stop indicator. Defaults to the indicator's strokeCap.
   */
  strokeCap?: StrokeCap;
  /**
   * Size of the stop indicator in dp. Defaults to the Material 3 default.
   */
  stopSize?: number;
};

export interface LinearProgressIndicatorProps extends ProgressCommonConfig {
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
   * Configuration for the stop indicator dot at the end of the determinate progress track.
   */
  drawStopIndicator?: DrawStopIndicatorConfig;
}

/**
 * A linear progress indicator that displays progress in a horizontal bar.
 *
 * Matches the Jetpack Compose `LinearProgressIndicator`.
 */
export const LinearProgressIndicator = createProgressComponent<LinearProgressIndicatorProps>(
  'LinearProgressIndicatorView'
);

// endregion

// region CircularProgressIndicator

export interface CircularProgressIndicatorProps extends ProgressCommonConfig {
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
}

/**
 * A circular progress indicator that displays progress in a circular format.
 *
 * Matches the Jetpack Compose `CircularProgressIndicator`.
 */
export const CircularProgressIndicator = createProgressComponent<CircularProgressIndicatorProps>(
  'CircularProgressIndicatorView'
);

// endregion

// region WavyProgressIndicators

/**
 * Wave configuration shared by the wavy progress indicator variants.
 */
export type WavyProgressCommonConfig = {
  /**
   * Height of the wave, where `0` draws a flat line and `1` draws the full wave height.
   * When set, the amplitude stays the same across the whole track.
   * When omitted, a determinate indicator uses the Material 3 default, which flattens the wave as
   * progress approaches `0` and `1`.
   * An indeterminate indicator defaults to the full wave height.
   */
  amplitude?: number;
  /**
   * Length of a single wave in dp. `CircularWavyProgressIndicator` rounds this to fit a whole
   * number of waves around the ring, so the wave it draws can be slightly shorter or longer.
   */
  wavelength?: number;
  /**
   * Speed of the wave in dp per second. Defaults to `wavelength`, which advances the wave by one
   * wavelength per second. Set it to `0` to stop the wave from moving.
   */
  waveSpeed?: number;
};

// endregion

// region LinearWavyProgressIndicator

export interface LinearWavyProgressIndicatorProps
  extends ProgressCommonConfig, WavyProgressCommonConfig {
  /**
   * Size of the stop indicator in dp at the end of the determinate progress track.
   */
  stopSize?: number;
}

/**
 * A linear progress indicator with wavy animation style.
 *
 * Matches the Jetpack Compose `LinearWavyProgressIndicator`.
 */
export const LinearWavyProgressIndicator =
  createProgressComponent<LinearWavyProgressIndicatorProps>('LinearWavyProgressIndicatorView');

// endregion

// region CircularWavyProgressIndicator

export interface CircularWavyProgressIndicatorProps
  extends ProgressCommonConfig, WavyProgressCommonConfig {}

/**
 * A circular progress indicator with wavy animation style.
 *
 * Matches the Jetpack Compose `CircularWavyProgressIndicator`.
 */
export const CircularWavyProgressIndicator =
  createProgressComponent<CircularWavyProgressIndicatorProps>('CircularWavyProgressIndicatorView');

// endregion
