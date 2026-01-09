import { requireNativeView } from 'expo';

import { type ViewEvent, type ExpoModifier } from '../../types';
import { align, padding } from '../modifiers';

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
  const { isRefreshing, onRefresh, ...restProps } = props;

  const loadingIndicatorModifiers = props.loadingIndicatorModifiers ?? [
    align('topCenter'),
    padding(0, 10, 0, 0),
  ];

  return {
    ...restProps,
    isRefreshing: isRefreshing ?? false,
    onRefresh: () => {
      onRefresh?.();
    },
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
    loadingIndicatorModifiers: loadingIndicatorModifiers.map(
      // @ts-expect-error
      (m) => m.__expo_shared_object_id__
    ),
  };
}

/**
 * Renders a `PullToRefreshBox` component.
 * A box that allows the user to pull down to refresh the content.
 */
export function PullToRefreshBox(props: PullToRefreshBoxProps) {
  return <NativePullToRefreshBoxView {...transformProps(props)} />;
}
