import { requireNativeView } from 'expo';
import React from 'react';

import { ExpoModifier } from '../../types';
import { PrimitiveBaseProps } from '../layout';

interface RNHostProps extends PrimitiveBaseProps {
  /**
   * When true, the RNHost will update its size in the Jetpack Compose view tree to match the children's size.
   * When false, the RNHost will use the size of the parent Jetpack Compose View.
   * Can be only set once on mount.
   * @default false
   */
  matchContents?: boolean;
  /**
   * The RN View to be hosted.
   */
  children: React.ReactElement;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];

  /**
   * When true, the RNHost will enable vertical scrolling.
   * @see Official [Jetpack Compose documentation](androidx.compose.ui.Modifier).verticalScroll(androidx.compose.foundation.ScrollState,kotlin.Boolean,androidx.compose.foundation.gestures.FlingBehavior,kotlin.Boolean)
   */
  verticalScrollEnabled?: boolean;
}

type NativeRNHostProps = RNHostProps;
const NativeRNHostView: React.ComponentType<NativeRNHostProps> = requireNativeView(
  'ExpoUI',
  'RNHostView'
);

export function RNHost(props: RNHostProps) {
  const { modifiers, ...restProps } = props;
  return (
    <NativeRNHostView
      {...restProps}
      // @ts-expect-error
      modifiers={modifiers?.map((m) => m.__expo_shared_object_id__)}
      // `matchContents` can only be used once on mount
      // So we force unmount when it changes to prevent unexpected layout
      key={props.matchContents ? 'matchContents' : 'noMatchContents'}
    />
  );
}
