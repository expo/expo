import { TextAlign } from './types';

export const convertAlign = (align: TextAlign | 'char'): TextAlign => {
  switch (align) {
    case 'char':
      return 'left';
    default:
      return align;
  }
};
