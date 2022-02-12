import { css, SerializedStyles } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import React from 'react';

import { LinkBase, LinkProps } from './Link';
import { TextComponentProps, TextElement } from './types';
import { withAnchor } from './withAnchor';

import { durations } from '~/ui/foundations/durations';

export { AnchorContext } from './withAnchor';

export function createTextComponent(Element: TextElement, textStyle?: SerializedStyles) {
  function TextComponent(props: TextComponentProps) {
    const { testID, tag, weight: textWeight, theme: textTheme, ...rest } = props;
    const TextElementTag = tag ?? Element;

    return (
      <TextElementTag
        css={[
          baseTextStyle,
          textStyle,
          textWeight && typography.utility.weight[textWeight],
          textTheme && { color: theme.text[textTheme] },
        ]}
        data-testid={testID}
        {...rest}
      />
    );
  }
  TextComponent.displayName = `Text(${Element})`;
  return TextComponent;
}

const baseTextStyle = css({
  ...typography.body.paragraph,
  color: theme.text.default,
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

export const H1 = withAnchor(
  createTextComponent(TextElement.H1, css(typography.headers.default.h1))
);
export const H2 = withAnchor(
  createTextComponent(TextElement.H2, css(typography.headers.default.h2))
);
export const H3 = withAnchor(
  createTextComponent(TextElement.H4, css(typography.headers.default.h3))
);
export const H4 = withAnchor(
  createTextComponent(TextElement.H4, css(typography.headers.default.h4))
);
export const H5 = withAnchor(
  createTextComponent(TextElement.H5, css(typography.headers.default.h5))
);
export const H6 = withAnchor(
  createTextComponent(TextElement.H6, css(typography.headers.default.h6))
);
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
