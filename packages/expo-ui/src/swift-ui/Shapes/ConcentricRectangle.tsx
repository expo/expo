import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { CommonViewModifierProps } from '../types';

export type CornerStyleConfig =
  | {
      type: 'concentric';
      minimumRadius?: number;
    }
  | {
      type: 'fixed';
      radius: number;
    };

export interface ConcentricRectangleCornerParams {
  topLeadingCorner?: CornerStyleConfig;
  topTrailingCorner?: CornerStyleConfig;
  bottomLeadingCorner?: CornerStyleConfig;
  bottomTrailingCorner?: CornerStyleConfig;
}

export interface ConcentricRectangleProps extends CommonViewModifierProps {
  corners?: ConcentricRectangleCornerParams;
}

export const EdgeCornerStyle = {
  concentric: (minimumRadius?: number): CornerStyleConfig => ({
    type: 'concentric',
    minimumRadius,
  }),
  fixed: (radius: number): CornerStyleConfig => ({
    type: 'fixed',
    radius,
  }),
};

const ConcentricRectangleNativeView: React.ComponentType<ConcentricRectangleProps> =
  requireNativeView('ExpoUI', 'ConcentricRectangleView');

export function ConcentricRectangle(props: ConcentricRectangleProps) {
  const { modifiers, ...restProps } = props;
  return (
    <ConcentricRectangleNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
    />
  );
}
