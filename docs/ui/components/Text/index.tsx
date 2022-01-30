import { css, SerializedStyles } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import React, { HTMLAttributes } from 'react';

import { LinkBase, LinkProps } from '~/ui/components/Link';
import { durations } from '~/ui/foundations/durations';

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

type TextComponentProps = HTMLAttributes<
  HTMLHeadingElement | HTMLParagraphElement | HTMLLIElement | HTMLUListElement | HTMLPreElement
> & {
  testID?: string;
  weight?: 'regular' | 'medium' | 'semiBold' | 'black';
  theme?: 'secondary' | 'success' | 'warning' | 'error';
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

export function createTextComponent(Element: TextElement, textStyle?: SerializedStyles) {
  function TextComponent(props: TextComponentProps) {
    const { className, testID, weight, tag, theme, ...rest } = props;
    const TextElementTag = tag ?? Element;

    return (
      <TextElementTag
        css={[baseTextStyle, textStyle, getWeightStyle(weight), getThemeStyle(theme)]}
        className={className}
        data-testid={testID}
        {...rest}
      />
    );
  }
  TextComponent.displayName = `Text(${Element})`;
  return TextComponent;
}

function getWeightStyle(weight: TextComponentProps['weight']) {
  switch (weight) {
    case 'regular':
      return css(typography.utility.weight.regular);
    case 'medium':
      return css(typography.utility.weight.medium);
    case 'semiBold':
      return css(typography.utility.weight.semiBold);
    case 'black':
      return css(typography.utility.weight.black);
    default:
      return null;
  }
}

function getThemeStyle(theme: TextComponentProps['theme']) {
  switch (theme) {
    case 'secondary':
      return themeSecondary;
    case 'success':
      return themeSuccess;
    case 'warning':
      return themeWarning;
    case 'error':
      return themeError;
    default:
      return null;
  }
}

const baseTextStyle = css({
  ...typography.body.paragraph,
  color: theme.text.default,
});

const themeSecondary = css({
  color: theme.text.secondary,
});

const themeSuccess = css({
  color: theme.text.success,
});

const themeWarning = css({
  color: theme.text.warning,
});

const themeError = css({
  color: theme.text.error,
});

const link = css({
  textDecoration: 'none',
  cursor: 'pointer',

  // transform prevents a 1px shift on hover on Safari
  transform: 'translate3d(0,0,0)',

  ':hover': {
    transition: durations.hover,
    opacity: 0.8,
  },
});

const listStyle = css({
  marginLeft: '1.5rem',
});

export const H1 = createTextComponent(TextElement.H1, css(typography.headers.default.h1));
export const H2 = createTextComponent(TextElement.H2, css(typography.headers.default.h2));
export const H3 = createTextComponent(TextElement.H4, css(typography.headers.default.h3));
export const H4 = createTextComponent(TextElement.H4, css(typography.headers.default.h4));
export const H5 = createTextComponent(TextElement.H5, css(typography.headers.default.h5));
export const H6 = createTextComponent(TextElement.H6, css(typography.headers.default.h6));
export const P = createTextComponent(TextElement.P, css(typography.body.paragraph));
export const CODE = createTextComponent(TextElement.CODE, css(typography.utility.inlineCode));
export const LI = createTextComponent(TextElement.LI, css(typography.body.li));
export const LABEL = createTextComponent(TextElement.SPAN, css(typography.body.label));
export const HEADLINE = createTextComponent(TextElement.P, css(typography.body.headline));
export const FOOTNOTE = createTextComponent(TextElement.P, css(typography.body.footnote));
export const CALLOUT = createTextComponent(TextElement.P, css(typography.body.callout));
export const BOLD = createTextComponent(TextElement.SPAN, css(typography.utility.weight.semiBold));
export const DEMI = createTextComponent(TextElement.SPAN, css(typography.utility.weight.medium));
export const UL = createTextComponent(TextElement.UL, css([typography.body.ul, listStyle]));
export const OL = createTextComponent(TextElement.OL, css([typography.body.ol, listStyle]));
export const PRE = createTextComponent(TextElement.PRE, css(typography.utility.pre));

export const A = (props: Omit<LinkProps, 'router'> & { isStyled?: boolean }) => {
  const { isStyled, ...rest } = props;
  return <LinkBase css={[link, isStyled && css(typography.utility.anchor)]} {...rest} />;
};
A.displayName = 'Text(a)';
