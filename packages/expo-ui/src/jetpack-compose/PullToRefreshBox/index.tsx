import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { type ViewEvent, type ModifierConfig } from '../../types';
import { type ContentAlignment } from '../layout-types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Configuration for the loading indicator shown during pull-to-refresh.
 */
export type PullToRefreshIndicatorProps = {
  /**
   * Color of the loading indicator spinner.
   * @default MaterialTheme.colorScheme.primary
   */
  color?: ColorValue;
  /**
   * Background color of the loading indicator container.
   * @default MaterialTheme.colorScheme.surfaceContainerHigh
   */
  containerColor?: ColorValue;
  /**
   * Modifiers for the loading indicator.
   */
  modifiers?: ModifierConfig[];
};

export type PullToRefreshBoxProps = {
  /**
   * Whether the content is refreshing.
   * @default false
   */
  isRefreshing?: boolean;
  /**
   * Callback that is called when the user pulls to refresh.
   */
  onRefresh?: () => void;
  /**
   * Alignment of children within the box.
   * @default 'topStart'
   */
  contentAlignment?: ContentAlignment;
  /**
   * Configuration for the loading indicator shown during pull-to-refresh.
   */
  indicator?: PullToRefreshIndicatorProps;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * The content to refresh.
   */
  children: React.ReactNode;
};

type NativePullToRefreshBoxProps = Omit<PullToRefreshBoxProps, 'onRefresh'> &
  ViewEvent<'onRefresh', void>;

const NativePullToRefreshBoxView: React.ComponentType<NativePullToRefreshBoxProps> =
  requireNativeView('ExpoUI', 'PullToRefreshBoxView');

function transformProps(props: PullToRefreshBoxProps): NativePullToRefreshBoxProps {
  const { isRefreshing, modifiers, onRefresh, ...restProps } = props;

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    isRefreshing: isRefreshing ?? false,
    onRefresh: () => {
      onRefresh?.();
    },
  };
}

/**
 * A pull-to-refresh container that wraps scrollable content and shows a refresh indicator when pulled,
 * matching Compose's `PullToRefreshBox`.
 */
export function PullToRefreshBox(props: PullToRefreshBoxProps) {
  return <NativePullToRefreshBoxView {...transformProps(props)} />;
}
