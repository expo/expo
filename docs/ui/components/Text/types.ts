import { theme, typography } from '@expo/styleguide';
import { HTMLAttributes } from 'react';

export enum TextElement {
  CODE = 'code',
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  H5 = 'h5',
  H6 = 'h6',
  LI = 'li',
  P = 'p',
  SPAN = 'span',
  UL = 'ul',
  OL = 'ol',
  PRE = 'pre',
}

export type TextWeight = keyof typeof typography.utility.weight;
export type TextTheme = keyof typeof theme.text;

export type TextComponentProps = HTMLAttributes<
  HTMLHeadingElement | HTMLParagraphElement | HTMLLIElement | HTMLUListElement | HTMLPreElement
> & {
  testID?: string;
  weight?: TextWeight;
  theme?: TextTheme;
  tag?:
    | 'code'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'li'
    | 'p'
    | 'span'
    | 'ul'
    | 'ol'
    | 'pre';
};
