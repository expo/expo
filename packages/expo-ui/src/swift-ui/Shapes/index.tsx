import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface RectangleProps extends CommonViewModifierProps {}

const RectangleNativeView: React.ComponentType<RectangleProps> = requireNativeView(
  'ExpoUI',
  'RectangleView'
);

export function Rectangle(props: RectangleProps) {
  const { modifiers, ...restProps } = props;
  return (
    <RectangleNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
    />
  );
}

export interface RoundedRectangleProps extends CommonViewModifierProps {
  cornerRadius?: number;
}

const RoundedRectangleNativeView: React.ComponentType<RoundedRectangleProps> = requireNativeView(
  'ExpoUI',
  'RoundedRectangleView'
);

export function RoundedRectangle(props: RoundedRectangleProps) {
  const { modifiers, ...restProps } = props;
  return (
    <RoundedRectangleNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
    />
  );
}

export interface EllipseProps extends CommonViewModifierProps {}

const EllipseNativeView: React.ComponentType<EllipseProps> = requireNativeView(
  'ExpoUI',
  'EllipseView'
);

export function Ellipse(props: EllipseProps) {
  const { modifiers, ...restProps } = props;
  return (
    <EllipseNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
    />
  );
}

export interface UnevenRoundedRectangleProps extends CommonViewModifierProps {
  topLeadingRadius?: number;
  topTrailingRadius?: number;
  bottomLeadingRadius?: number;
  bottomTrailingRadius?: number;
}

const UnevenRoundedRectangleNativeView: React.ComponentType<UnevenRoundedRectangleProps> =
  requireNativeView('ExpoUI', 'UnevenRoundedRectangleView');

export function UnevenRoundedRectangle(props: UnevenRoundedRectangleProps) {
  const { modifiers, ...restProps } = props;
  return (
    <UnevenRoundedRectangleNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
    />
  );
}

export interface CapsuleProps extends CommonViewModifierProps {
  cornerStyle?: 'continuous' | 'circular';
}

const CapsuleNativeView: React.ComponentType<CapsuleProps> = requireNativeView(
  'ExpoUI',
  'CapsuleView'
);

export function Capsule(props: CapsuleProps) {
  const { modifiers, ...restProps } = props;
  return (
    <CapsuleNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
    />
  );
}

export interface CircleProps extends CommonViewModifierProps {}

const CircleNativeView: React.ComponentType<CircleProps> = requireNativeView(
  'ExpoUI',
  'CircleView'
);

export function Circle(props: CircleProps) {
  const { modifiers, ...restProps } = props;
  return (
    <CircleNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
    />
  );
}

export * from './ConcentricRectangle';
