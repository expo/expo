import { requireNativeView } from 'expo';

import { Slot } from '../SlotView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type Alignment, type CommonViewModifierProps } from '../types';

export type BackgroundProps = {
  /**
   * The foreground content. Provide the background view via `Background.Content`.
   *
   * Maps to SwiftUI's `.background(alignment:content:)`: the `Background.Content` is drawn behind
   * the foreground and is sized to it, so a full-bleed background image does not expand or
   * compress the foreground (unlike a `ZStack`). This makes it the correct primitive for widget
   * and Live Activity backgrounds.
   */
  children: React.ReactNode;
  /**
   * The alignment of the background content relative to the foreground content.
   * @default 'center'
   */
  alignment?: Alignment;
} & CommonViewModifierProps;

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
      {...restProps}>
      {children}
    </BackgroundNativeView>
  );
}
