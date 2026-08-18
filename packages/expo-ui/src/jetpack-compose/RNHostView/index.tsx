import { requireNativeView } from 'expo';
import type { ReactElement, ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { useIsPresentedInOwnWindow } from '../../PresentedContentContext';
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
}

type NativeRNHostProps = RNHostProps & {
  layoutRoot: boolean;
  // Set below, not by the caller: a React Native style cannot describe a Jetpack Compose view, and
  // the one property that does reach the shadow node is the cross-axis sizing `matchContents` needs.
  style?: StyleProp<ViewStyle>;
};
const NativeRNHostView: ComponentType<NativeRNHostProps> = requireNativeView(
  'ExpoUI',
  'RNHostView'
);

function transformProps(props: RNHostProps, layoutRoot: boolean): NativeRNHostProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    layoutRoot,
  };
}

// `matchContents` reads the hosted content's Yoga size, so this view must not stretch to its
// own parent on the cross axis. A stretched box makes the content measure the container instead of
// itself, and under a `matchContents` `Host` that feeds back into the size it came from: the
// content grows by the surrounding chrome on every pass and layout never settles.
// https://github.com/expo/expo/pull/48059
const hugCrossAxis = { alignSelf: 'flex-start' } as const;

export function RNHostView(props: RNHostProps) {
  // Content presented in its own window — a modal bottom sheet, a dialog — has no React root above
  // it, so it dispatches its own touches and is measured from itself. Everywhere else the surface
  // root already streams this subtree's touches, and a second stream in a second coordinate space
  // is what makes a `Pressable` drop its press on the first finger movement.
  const layoutRoot = useIsPresentedInOwnWindow();

  return (
    <NativeRNHostView
      {...transformProps(props, layoutRoot)}
      style={props.matchContents ? hugCrossAxis : undefined}
      // `matchContents` can only be used once on mount
      // So we force unmount when it changes to prevent unexpected layout
      key={props.matchContents ? 'matchContents' : 'noMatchContents'}
    />
  );
}
