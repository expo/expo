import { css, CSSObject, SerializedStyles } from '@emotion/react';
import { theme, typography, LinkBase, LinkBaseProps, mergeClasses } from '@expo/styleguide';
import { spacing, borderRadius } from '@expo/styleguide-base';
import * as React from 'react';

import { TextComponentProps, TextElement } from './types';

import { AdditionalProps, HeadingType } from '~/common/headingManager';
import { Permalink } from '~/ui/components/Permalink';

export { AnchorContext } from './withAnchor';

const CRAWLABLE_HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5'];
const CRAWLABLE_TEXT = ['span', 'p', 'li', 'blockquote', 'code', 'pre'];

type PermalinkedComponentProps = React.PropsWithChildren<
  { level?: number; id?: string } & AdditionalProps & TextComponentProps
>;

const isDev = process.env.NODE_ENV === 'development';

export const createPermalinkedComponent = (
  BaseComponent: React.ComponentType<React.PropsWithChildren<TextComponentProps>>,
  options?: {
    baseNestingLevel?: number;
    sidebarType?: HeadingType;
    iconSize?: 'sm' | 'xs';
    className?: string;
  }
) => {
  const { baseNestingLevel, iconSize = 'sm', sidebarType = HeadingType.Text } = options || {};
  return ({ children, level, id, className, ...props }: PermalinkedComponentProps) => {
    const cleanChildren = React.Children.map(children, child => {
      if (React.isValidElement(child) && child?.props?.href) {
        isDev &&
          console.warn(
            `It looks like the header on this page includes a link, this is an invalid pattern, nested link will be removed!`,
            child?.props?.href
          );
        return (child as JSX.Element)?.props?.children;
      }
      return child;
    });
    const nestingLevel = baseNestingLevel != null ? (level ?? 0) + baseNestingLevel : undefined;
    return (
      <Permalink
        nestingLevel={nestingLevel}
        additionalProps={{
          ...props,
          sidebarType,
          iconSize,
          className: mergeClasses(className, options?.className),
        }}
        id={id}>
        <BaseComponent>{cleanChildren}</BaseComponent>
      </Permalink>
    );
  };
};

export function createTextComponent(
  Element: TextElement,
  textStyle?: SerializedStyles,
  skipBaseStyle: boolean = false
) {
  function TextComponent(props: TextComponentProps) {
    const {
      testID,
      tag,
      className,
      weight: textWeight,
      theme: textTheme,
      crawlable = true,
      ...rest
    } = props;
    const TextElementTag = tag ?? Element;

    return (
      <TextElementTag
        className={className}
        css={[
          !skipBaseStyle && baseTextStyle,
          textStyle,
          textWeight && { fontWeight: typography.utility.weight[textWeight].fontWeight },
          textTheme && { color: theme.text[textTheme] },
        ]}
        data-testid={testID}
        data-heading={(crawlable && CRAWLABLE_HEADINGS.includes(TextElementTag)) || undefined}
        data-text={(crawlable && CRAWLABLE_TEXT.includes(TextElementTag)) || undefined}
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

const linkStyled = css({
  ...typography.utility.anchor,

  // note(Cedric): transform prevents a 1px shift on hover on Safari
  transform: 'translate3d(0,0,0)',

  ':hover': {
    textDecoration: 'underline',

    code: {
      textDecoration: 'inherit',
    },
  },

  'span, code, strong, em, b, i': {
    color: theme.text.link,
  },
});

const codeStyle = css({
  borderColor: theme.border.secondary,
  borderRadius: borderRadius.sm,
  wordBreak: 'unset',
});

export const kbdStyle = css({
  fontWeight: 500,
  color: theme.text.secondary,
  padding: `0 ${spacing[1]}px`,
  boxShadow: `0 0.1rem 0 1px ${theme.border.default}`,
  borderRadius: borderRadius.sm,
  position: 'relative',
  display: 'inline-flex',
  margin: 0,
  minWidth: 22,
  justifyContent: 'center',
  top: -1,
});

const { h1, h2, h3, h4, h5 } = typography.headers.default;
const codeInHeaderStyle = { '& code': { fontSize: '90%' } };

const h1Style = {
  ...h1,
  fontWeight: 700,
  marginTop: spacing[2],
  marginBottom: spacing[2],
  ...codeInHeaderStyle,
};

const h2Style = {
  ...h2,
  fontWeight: 700,
  marginTop: spacing[8],
  marginBottom: spacing[3.5],
  '& a:focus-visible': { outlineOffset: spacing[1] },
  ...codeInHeaderStyle,
};

const h3Style = {
  ...h3,
  fontWeight: 600,
  marginTop: spacing[7],
  marginBottom: spacing[3],
  '& a:focus-visible': { outlineOffset: spacing[1] },
  ...codeInHeaderStyle,
};

const h4Style = {
  ...h4,
  fontWeight: 600,
  marginTop: spacing[6],
  marginBottom: spacing[2],
  ...codeInHeaderStyle,
};

const h5Style = {
  ...h5,
  fontWeight: 600,
  marginTop: spacing[4],
  marginBottom: spacing[1],
  ...codeInHeaderStyle,
};

const paragraphStyle = {
  strong: {
    wordBreak: 'break-word',
  },
};

const delStyle = {
  textDecoration: 'line-through',
  '& code': {
    textDecoration: 'line-through',
  },
};

export const H1 = createTextComponent(TextElement.H1, css(h1Style));
export const RawH2 = createTextComponent(TextElement.H2, css(h2Style));
export const H2 = createPermalinkedComponent(RawH2, { baseNestingLevel: 2 });
export const RawH3 = createTextComponent(TextElement.H3, css(h3Style));
export const H3 = createPermalinkedComponent(RawH3, { baseNestingLevel: 3 });
export const RawH4 = createTextComponent(TextElement.H4, css(h4Style));
export const H4 = createPermalinkedComponent(RawH4, { baseNestingLevel: 4 });
export const RawH5 = createTextComponent(TextElement.H5, css(h5Style));
export const H5 = createPermalinkedComponent(RawH5, { baseNestingLevel: 5 });

export const P = createTextComponent(TextElement.P, css(paragraphStyle as CSSObject));
export const CODE = createTextComponent(
  TextElement.CODE,
  css([typography.utility.inlineCode, codeStyle]),
  true
);
export const LI = createTextComponent(TextElement.LI, css(typography.body.li));
export const LABEL = createTextComponent(TextElement.SPAN, css(typography.body.label));
export const HEADLINE = createTextComponent(TextElement.P, css(typography.body.headline));
export const FOOTNOTE = createTextComponent(TextElement.P, css(typography.body.footnote));
export const CAPTION = createTextComponent(TextElement.P, css(typography.body.caption));
export const CALLOUT = createTextComponent(TextElement.P, css(typography.body.callout));
export const BOLD = createTextComponent(TextElement.STRONG, css({ fontWeight: 600 }));
export const DEMI = createTextComponent(TextElement.SPAN, css({ fontWeight: 500 }));
export const SPAN = createTextComponent(TextElement.SPAN, css(typography.body.callout));

export const UL = createTextComponent(
  TextElement.UL,
  css([typography.body.ul, { listStyle: 'disc' }])
);
export const OL = createTextComponent(
  TextElement.OL,
  css([typography.body.ol, { listStyle: 'decimal' }])
);
export const PRE = createTextComponent(TextElement.PRE, css(typography.utility.pre as CSSObject));
export const KBD = createTextComponent(
  TextElement.KBD,
  css([typography.utility.pre as CSSObject, kbdStyle])
);
export const MONOSPACE = createTextComponent(TextElement.CODE);
export const DEL = createTextComponent(TextElement.DEL, css(delStyle));

const isExternalLink = (href?: string) => href?.includes('://');

export const A = (props: LinkBaseProps & { isStyled?: boolean; shouldLeakReferrer?: boolean }) => {
  const { isStyled, openInNewTab, shouldLeakReferrer, className, ...rest } = props;

  return (
    <LinkBase
      css={[!isStyled && linkStyled]}
      className={mergeClasses('cursor-pointer decoration-0 hocus:opacity-80', className)}
      {...(shouldLeakReferrer && { target: '_blank', referrerPolicy: 'origin' })}
      openInNewTab={(!shouldLeakReferrer && openInNewTab) ?? isExternalLink(props.href)}
      {...rest}
    />
  );
};
A.displayName = 'Text(a)';
