import { TextAlign } from './types';

export function convertAlignToClass(align: TextAlign | 'char'): string {
  switch (align) {
    case 'left':
    case 'char':
      return 'text-left';
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    case 'justify':
      return 'text-justify';
  }
}
