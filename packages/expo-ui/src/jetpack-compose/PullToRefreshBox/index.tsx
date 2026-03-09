import { requireNativeView } from 'expo';

import { type ViewEvent, type ExpoModifier } from '../../types';
import { align } from '../modifiers';
import { createViewModifierEventListener } from '../modifiers/utils';

export type PullToRefreshBoxProps = {
  /**
   * Whether the content is refreshing.
   * @default false
   */
  isRefreshing?: boolean;
  /**
   * Callback to call when the content is refreshed.
   */
  onRefresh?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];

  /**
   * Modifiers for the loading indicator.
   * @default [align('topCenter'), padding(0, 10, 0, 0)]
   */
  loadingIndicatorModifiers?: ExpoModifier[];

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

  const loadingIndicatorModifiers = props.loadingIndicatorModifiers ?? [
    align('topCenter'),
    // padding(0, 10, 0, 0),
  ];

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    isRefreshing: isRefreshing ?? false,
    onRefresh: () => {
      onRefresh?.();
    },
    loadingIndicatorModifiers,
  };
}

/**
 * Renders a `PullToRefreshBox` component.
 * A box that allows the user to pull down to refresh the content.
 */
export function PullToRefreshBox(props: PullToRefreshBoxProps) {
  return <NativePullToRefreshBoxView {...transformProps(props)} />;
}
