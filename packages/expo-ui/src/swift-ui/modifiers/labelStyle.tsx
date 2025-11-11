import { createModifier } from '../modifiers/createModifier';

export type LabelStyle = 'titleOnly' | 'titleAndIcon' | 'iconOnly';

export const labelStyle = (style: LabelStyle) => {
  return createModifier('labelStyle', { style });
};
