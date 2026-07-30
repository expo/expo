import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { getStateId, type ObservableState } from '../../State';
import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Common props shared by loading indicator variants.
 */
export type LoadingIndicatorCommonConfig = {
  /**
   * An observable state that holds the current progress value.
   * Create one with `useNativeState(0)`. Omit for indeterminate loading.
   */
  progress?: ObservableState<number | null>;
  /**
   * Loading indicator color.
   */
  color?: ColorValue;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeLoadingIndicatorCommonConfig = Omit<
  LoadingIndicatorCommonConfig,
  'progress' | 'modifiers'
> & {
  progress?: number;
  modifiers?: unknown;
};

function transformProps<T extends LoadingIndicatorCommonConfig>(
  props: T
): NativeLoadingIndicatorCommonConfig {
  const { modifiers, progress, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    progress: getStateId(progress),
  };
}

function createLoadingIndicatorComponent<P extends LoadingIndicatorCommonConfig>(
  viewName: string
): React.ComponentType<P> {
  const NativeView: React.ComponentType<NativeLoadingIndicatorCommonConfig> = requireNativeView(
    'ExpoUI',
    viewName
  );
  function Component(props: P) {
    return <NativeView {...transformProps(props)} />;
  }
  Component.displayName = viewName;
  return Component;
}

// region LoadingIndicator

/**
 * A loading indicator that displays loading using morphing shapes.
 *
 * Matches the Jetpack Compose `LoadingIndicator`.
 */
export const LoadingIndicator = createLoadingIndicatorComponent('LoadingIndicatorView');

// endregion

// region ContainedLoadingIndicator

export interface ContainedLoadingIndicatorProps extends LoadingIndicatorCommonConfig {
  /**
   * Loading indicator's container color
   */
  containerColor?: ColorValue;
}

/**
 * A loading indicator that displays loading using morphing shapes inside a container.
 *
 * Matches the Jetpack Compose `ContainedLoadingIndicator`.
 */
export const ContainedLoadingIndicator =
  createLoadingIndicatorComponent<ContainedLoadingIndicatorProps>('ContainedLoadingIndicatorView');
// endregion

// Exported for docs api data
export { type ObservableState };
