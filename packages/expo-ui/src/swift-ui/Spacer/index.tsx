import { requireNativeView } from 'expo';

import { isMissingHost, MissingHostErrorView } from '../Host';
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
  if (isMissingHost(props)) {
    return <MissingHostErrorView componentName="Spacer" />;
  }
  return <SpacerNativeView {...transformSpacerProps(props)} />;
}
