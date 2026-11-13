import { requireNativeView } from 'expo';
import { type ReactNode } from 'react';
import { type SFSymbol } from 'sf-symbols-typescript';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface ContentUnavailableViewProps extends CommonViewModifierProps {
  /**
   * A short title that describes why the content is not available.
   */
  title?: string;

  /**
   * SF Symbol indicating why the content is not available.
   */
  systemImage?: SFSymbol;

  /**
   * Description of why the content is not available.
   */
  description?: string;

  /**
   * Controls shown below the description, such as a `Button` that tries again.
   */
  actions?: ReactNode;
}

type NativeContentUnavailableViewProps = Omit<ContentUnavailableViewProps, 'actions'> & {
  children?: ReactNode;
};

const ContentUnavailableViewNativeView: React.ComponentType<NativeContentUnavailableViewProps> =
  requireNativeView('ExpoUI', 'ContentUnavailableView');

function transformContentUnavailableViewProps(
  props: ContentUnavailableViewProps
): NativeContentUnavailableViewProps {
  const { modifiers, actions, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * Displays a native Swift UI ContentUnavailableView.
 * @platform ios 17.0+
 * @platform tvos 17.0+
 */
export function ContentUnavailableView(props: ContentUnavailableViewProps) {
  return (
    <ContentUnavailableViewNativeView {...transformContentUnavailableViewProps(props)}>
      {props.actions != null ? <Slot name="actions">{props.actions}</Slot> : null}
    </ContentUnavailableViewNativeView>
  );
}
