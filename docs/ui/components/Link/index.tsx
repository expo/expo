import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import NextLink from 'next/link';
import React, { forwardRef } from 'react';

export type LinkProps = React.PropsWithChildren<{
  target?: string;
  tabIndex?: number;
  href?: string;
  title?: string;
  rel?: string;
  as?: string;
  isStyled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  onMouseMove?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  onTouchStart?: (event: React.TouchEvent<HTMLAnchorElement>) => void;
  testID?: string;
  style?: React.CSSProperties;
  className?: string;
  openInNewTab?: boolean;
  ariaLabel?: string;
}>;

export const LinkBase = forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  const { href, openInNewTab = false } = props;
  const relProp = props.target === '_blank' && !props.rel ? 'noopener' : props.rel;

  function onKeyDown(event: React.KeyboardEvent<HTMLAnchorElement>) {
    if (event.key === 'Enter' && props.onClick) {
      props.onClick(event as any);
    }
  }

  return (
    <NextLink href={href ?? ''} passHref={Boolean(href)}>
      <a
        ref={ref}
        aria-label={props.ariaLabel}
        css={props.isStyled ? linkStyle : undefined}
        className={props.className}
        title={props.title}
        style={props.style}
        onClick={props.onClick}
        tabIndex={props.tabIndex}
        data-testid={props.testID}
        target={openInNewTab ? '_blank' : props.target}
        rel={openInNewTab ? 'noopener noreferrer' : relProp}
      >
        {props.children}
      </a>
    </NextLink>
  );
});

const linkStyle = css({
  textDecoration: 'none',
  cursor: 'pointer',
  opacity: 1,
  ':hover': {
    transition: durations.hover,
    opacity: 0.8,
  },
  ':visited': {
    color: theme.link.default,
  },
});
