import { requireNativeView } from 'expo';
import type { ReactElement, ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ModifierConfig } from '../../types';
import type { PrimitiveBaseProps } from '../layout';
import { createViewModifierEventListener } from '../modifiers/utils';

export interface RNHostProps extends PrimitiveBaseProps {
  /**
   * When `true`, the RNHost will update its size in the Jetpack Compose view tree to match the children's size.
   * When `false`, the RNHost will use the size of the parent Jetpack Compose View.
   * Can be only set once on mount.
   * @default false
   */
  matchContents?: boolean;
  /**
   * The RN View to be hosted.
   */
  children: ReactElement;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Style applied to the host view's React Native shadow node. Useful for
   * controlling its layout position (e.g. `position: 'absolute'`).
   */
  style?: StyleProp<ViewStyle>;
}

type NativeRNHostProps = RNHostProps & {
  layoutRoot: boolean;
};
const NativeRNHostView: ComponentType<NativeRNHostProps> = requireNativeView(
  'ExpoUI',
  'RNHostView'
);

function transformProps(props: RNHostProps): NativeRNHostProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    // Touches on hosted content are dispatched relative to the host, so `measure()` must report
    // the same coordinate space; otherwise `Pressable` cancels the press on any finger movement.
    layoutRoot: true,
  };
}

export function RNHostView(props: RNHostProps) {
  return (
    <NativeRNHostView
      {...transformProps(props)}
      // `matchContents` can only be used once on mount
      // So we force unmount when it changes to prevent unexpected layout
      key={props.matchContents ? 'matchContents' : 'noMatchContents'}
    />
  );
}
