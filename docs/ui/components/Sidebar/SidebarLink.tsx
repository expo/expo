import { css } from '@emotion/react';
import { theme, typography, LinkBase } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import { ArrowUpRightIcon } from '@expo/styleguide-icons';
import { useRouter } from 'next/router';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

import { stripVersionFromPath } from '~/common/utilities';
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
  const { asPath, pathname } = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);

  const checkSelection = () => {
    // Special case for root url
    if (info.name === 'Introduction') {
      if (asPath.match(/\/versions\/[\w.]+\/$/) || asPath === '/versions/latest/') {
        return true;
      }
    }

    const linkUrl = stripVersionFromPath(info.as || info.href);
    return linkUrl === stripVersionFromPath(pathname) || linkUrl === stripVersionFromPath(asPath);
  };

  const isSelected = checkSelection();

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
        {isSelected && <div css={STYLES_ACTIVE_BULLET} />}
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
  padding-left: ${spacing[4] + spacing[0.5]}px;
  scroll-margin: 60px;
  width: 100%;

  &:hover {
    color: ${theme.text.link};
  }
`;

const STYLES_LINK_ACTIVE = css`
  color: ${theme.text.link};
  padding-left: 0;
`;

const STYLES_CONTAINER = css`
  display: flex;
  min-height: 32px;
  align-items: center;
  padding: ${spacing[1]}px;
  padding-right: ${spacing[2]}px;
`;

const STYLES_ACTIVE_BULLET = css`
  height: 6px;
  width: 6px;
  min-height: 6px;
  min-width: 6px;
  background-color: ${theme.text.link};
  border-radius: 100%;
  margin: ${spacing[2]}px ${spacing[1.5]}px;
`;
