import { requireNativeView } from 'expo';

import { ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type SpacerProps = {
  /**
   * Modifiers for the component. Use weight() modifier to make the spacer flexible.
   */
  modifiers?: ExpoModifier[];
};

type NativeSpacerProps = SpacerProps;
const SpacerNativeView: React.ComponentType<SpacerProps> = requireNativeView(
  'ExpoUI',
  'SpacerView'
);

function transformProps(props: SpacerProps): NativeSpacerProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A spacer component that fills available space.
 * Use with the weight() modifier to create flexible spacing in Row or Column layouts.
 *
 * @example
 * ```tsx
 * <Row>
 *   <Text>Left</Text>
 *   <Spacer modifiers={[weight(1)]} />
 *   <Text>Right</Text>
 * </Row>
 * ```
 */
export function Spacer(props: SpacerProps) {
  return <SpacerNativeView {...transformProps(props)} />;
}
