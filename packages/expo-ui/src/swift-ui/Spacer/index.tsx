import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface SpacerProps extends CommonViewModifierProps {
  /**
   * The minimum length of the spacer.
   * This is the minimum amount of space that the spacer will take up.
   */
  minLength?: number;
}

type NativeSpacerProps = SpacerProps;

const SpacerNativeView: React.ComponentType<NativeSpacerProps> = requireNativeView(
  'ExpoUI',
  'SpacerView'
);

function transformSpacerProps(props: SpacerProps): NativeSpacerProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

export function Spacer(props: SpacerProps) {
  return <SpacerNativeView {...transformSpacerProps(props)} />;
}
