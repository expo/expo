import { css } from '@emotion/react';
import { theme, typography, LinkBase } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { useRouter } from 'next/compat/router';
import { useEffect, useRef, type PropsWithChildren } from 'react';

import { isRouteActive } from '~/common/routes';
import { NavigationRoute } from '~/types/common';

type SidebarLinkProps = PropsWithChildren<{
  info: NavigationRoute;
}>;

const HEAD_NAV_HEIGHT = 160;

const isLinkInViewport = (element: HTMLAnchorElement) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top - HEAD_NAV_HEIGHT >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export const SidebarLink = ({ info, children }: SidebarLinkProps) => {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);

  const isSelected = isRouteActive(info, router?.asPath, router?.pathname);

  useEffect(() => {
    if (isSelected && ref?.current && !isLinkInViewport(ref?.current)) {
      setTimeout(() => ref?.current && ref.current.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, []);

  if (info.hidden) {
    return null;
  }

  const customDataAttributes = isSelected && {
    'data-sidebar-anchor-selected': true,
  };
  const isExternal = info.href.startsWith('http');

  return (
    <div css={STYLES_CONTAINER}>
      <LinkBase
        href={info.href as string}
        ref={ref}
        css={[STYLES_LINK, isSelected && STYLES_LINK_ACTIVE]}
        {...customDataAttributes}>
        <div css={[STYLES_BULLET, isSelected && STYLES_ACTIVE_BULLET]} />
        {children}
        {isExternal && <ArrowUpRightIcon className="icon-sm text-icon-secondary ml-auto" />}
      </LinkBase>
    </div>
  );
};

const STYLES_LINK = css`
  ${typography.fontSizes[14]}
  display: flex;
  flex-direction: row;
  text-decoration: none;
  color: ${theme.text.secondary};
  transition: 50ms ease color;
  align-items: center;
  scroll-margin: 60px;
  width: 100%;
  margin-left: -${spacing[2] + spacing[0.5]}px;

  &:hover {
    color: ${theme.text.link};
  }

  &:hover svg {
    color: ${theme.button.tertiary.icon};
  }
`;

const STYLES_LINK_ACTIVE = css`
  color: ${theme.text.link};
`;

const STYLES_CONTAINER = css`
  display: flex;
  min-height: 32px;
  align-items: center;
  padding: ${spacing[1]}px;
  padding-right: ${spacing[2]}px;
`;

const STYLES_BULLET = css`
  height: 6px;
  width: 6px;
  min-height: 6px;
  min-width: 6px;
  border-radius: 100%;
  margin: ${spacing[2]}px ${spacing[1.5]}px;
  align-self: self-start;
`;

const STYLES_ACTIVE_BULLET = css`
  background-color: ${theme.text.link};
`;
