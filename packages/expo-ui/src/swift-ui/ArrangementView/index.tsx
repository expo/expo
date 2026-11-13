import { requireNativeView } from 'expo';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface ArrangementViewProps extends CommonViewModifierProps {
  /**
   * The views to arrange. Provide `ArrangementView.Primary` and `ArrangementView.Secondary`.
   */
  children: React.ReactNode;
}

const ArrangementViewNativeView: React.ComponentType<ArrangementViewProps> = requireNativeView(
  'ExpoUI',
  'ArrangementViewView'
);

/**
 * The primary view of the arrangement.
 */
function ArrangementViewPrimary(props: { children: React.ReactNode }) {
  return <Slot name="primary">{props.children}</Slot>;
}

/**
 * The secondary view of the arrangement.
 */
function ArrangementViewSecondary(props: { children: React.ReactNode }) {
  return <Slot name="secondary">{props.children}</Slot>;
}

ArrangementView.Primary = ArrangementViewPrimary;
ArrangementView.Secondary = ArrangementViewSecondary;

/**
 * ArrangementView uses the native [ArrangementView](https://developer.apple.com/documentation/swiftui/arrangementview) view.
 *
 * A view that arranges primary and secondary content using an adaptive layout that responds to
 * the environment.
 *
 * > **Note:** Below iOS 27.1, the children render without a container.
 * @example
 * ```tsx
 * <Host style={{ flex: 1 }}>
 *   <ArrangementView modifiers={[arrangementViewStyle('split')]}>
 *     <ArrangementView.Primary>
 *       <NowPlaying />
 *     </ArrangementView.Primary>
 *     <ArrangementView.Secondary>
 *       <Lyrics />
 *     </ArrangementView.Secondary>
 *   </ArrangementView>
 * </Host>
 * ```
 * @platform ios 27.1+
 * @platform tvos 27.1+
 */
export function ArrangementView(props: ArrangementViewProps) {
  const { modifiers, children, ...restProps } = props;

  return (
    <ArrangementViewNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children}
    </ArrangementViewNativeView>
  );
}
