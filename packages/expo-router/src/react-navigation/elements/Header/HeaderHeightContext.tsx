import { getNamedContext } from '../getNamedContext';

export const HeaderHeightContext = getNamedContext<number | undefined>(
  'HeaderHeightContext',
  undefined
);
