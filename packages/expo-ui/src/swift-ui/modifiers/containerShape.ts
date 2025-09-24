import { createModifier } from './createModifier';

export const RoundedRectangularShape = {
  rect: (cornerRadius?: number) => ({
    cornerRadius,
  }),
};

/**
 * Sets the container shape for the view.
 * @param shape - A shape configuration from RoundedRectangularShape.rect()
 */
export const containerShape = (shape: ReturnType<typeof RoundedRectangularShape.rect>) =>
  createModifier('containerShape', shape);
