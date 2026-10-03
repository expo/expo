import { requireNativeView } from 'expo';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type Alignment, type CommonViewModifierProps } from '../types';

export interface BackgroundProps extends CommonViewModifierProps {
  children: React.ReactNode;
  /**
   * The alignment of the background content relative to the base content.
   * @default 'center'
   */
  alignment?: Alignment;
}

const BackgroundNativeView: React.ComponentType<BackgroundProps> = requireNativeView(
  'ExpoUI',
  'BackgroundView'
);

function BackgroundContent(props: { children: React.ReactNode }) {
  return <Slot name="content">{props.children}</Slot>;
}

Background.Content = BackgroundContent;

export function Background(props: BackgroundProps) {
  const { modifiers, children, ...restProps } = props;

  return (
    <BackgroundNativeView
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      modifiers={modifiers}
      {...restProps}>
      {children}
    </BackgroundNativeView>
  );
}
