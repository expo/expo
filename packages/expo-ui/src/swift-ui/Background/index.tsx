import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type Alignment, type CommonViewModifierProps } from '../types';

export type BackgroundProps = {
  /**
   * The foreground content, followed by a single background view as the LAST child.
   *
   * Maps to SwiftUI's `.background(alignment:content:)`: the background is drawn behind the
   * foreground and is sized to it, so a full-bleed background image does not expand or compress
   * the foreground (unlike a `ZStack`). This makes it the correct primitive for widget and Live
   * Activity backgrounds.
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
