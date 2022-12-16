import NextLink from 'next/link';
import { CSSProperties, forwardRef, PropsWithChildren, MouseEvent } from 'react';

export type LinkProps = PropsWithChildren<{
  target?: string;
  tabIndex?: number;
  href?: string;
  title?: string;
  rel?: string;
  isStyled?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  testID?: string;
  style?: CSSProperties;
  className?: string;
  openInNewTab?: boolean;
  ariaLabel?: string;
}>;

export const LinkBase = forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  const { href, openInNewTab = false } = props;
  const relProp = props.target === '_blank' && !props.rel ? 'noopener' : props.rel;

  return (
    <NextLink
      href={href ?? ''}
      ref={ref}
      aria-label={props.ariaLabel}
      className={props.className}
      title={props.title}
      style={props.style}
      onClick={props.onClick}
      tabIndex={props.tabIndex}
      data-testid={props.testID}
      target={openInNewTab ? '_blank' : props.target}
      rel={openInNewTab ? 'noopener noreferrer' : relProp}>
      {props.children}
    </NextLink>
  );
});
