import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Common props shared by loading indicator variants.
 */
export type LoadingIndicatorCommonConfig = {
  /**
   * The current progress value between `0` and `1`. Omit for indeterminate.
   */
  progress?: number | null;
  /**
   * Loading indicator color.
   */
  color?: ColorValue;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

function transformProps<T extends LoadingIndicatorCommonConfig>(props: T): T {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  } as T;
}

function createLoadingIndicatorComponent<P extends LoadingIndicatorCommonConfig>(
  viewName: string
): React.ComponentType<P> {
  const NativeView: React.ComponentType<P> = requireNativeView('ExpoUI', viewName);
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

export type ContainedLoadingIndicatorProps = LoadingIndicatorCommonConfig & {
  /**
   * Loading indicator's container color
   */
  containerColor?: ColorValue;
};

/**
 * A loading indicator that displays loading using morphing shapes inside a container.
 *
 * Matches the Jetpack Compose `ContainedLoadingIndicator`.
 */
export const ContainedLoadingIndicator =
  createLoadingIndicatorComponent<ContainedLoadingIndicatorProps>('ContainedLoadingIndicatorView');

// endregion
