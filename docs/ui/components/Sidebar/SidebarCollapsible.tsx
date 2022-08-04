import { css } from '@emotion/react';
import { theme, typography, iconSize, spacing, ChevronDownIcon } from '@expo/styleguide';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import stripVersionFromPath from '~/common/stripVersionFromPath';
import { NavigationRoute } from '~/types/common';

const STYLES_CHEVRON_ICON = css({
  marginRight: spacing[2],
  transition: '100ms ease transform',
});

const STYLES_TITLE = css`
  ${typography.fontSizes[15]}
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: ${spacing[2]}px;
  font-family: ${typography.fontFaces.medium};
  user-select: none;
  min-height: 32px;
  color: ${theme.text.default};

  :hover {
    cursor: pointer;
  }
`;

const STYLES_CLOSED_CHEVRON_ICON = css({
  transform: 'rotate(-90deg)',
});

if (typeof window !== 'undefined' && !window.hasOwnProperty('sidebarState')) {
  window.sidebarState = {};
}

type SidebarCollapsibleProps = React.PropsWithChildren<{
  info: NavigationRoute;
}>;

export const SidebarCollapsible = ({ info, children }: SidebarCollapsibleProps) => {
  const router = useRouter();

  const isChildRouteActive = () => {
    let result = false;

    const sections = info.children;

    const isSectionActive = (section: NavigationRoute) => {
      const linkUrl = stripVersionFromPath(section.as || section.href);
      const pathname = stripVersionFromPath(router.pathname);
      const asPath = stripVersionFromPath(router.asPath);

      if (linkUrl === pathname || linkUrl === asPath) {
        result = true;
      }
    };

    let posts: NavigationRoute[] = [];
    sections?.forEach(section => {
      posts = [...posts, ...(section?.children ?? [])];
    });

    posts.forEach(isSectionActive);
    return result;
  };

  const hasCachedState =
    typeof window !== 'undefined' && window.sidebarState[info.name] !== undefined;

  const initState = hasCachedState
    ? window.sidebarState[info.name]
    : isChildRouteActive() || info.expanded;

  const [isOpen, setOpen] = useState(initState);

  const toggleIsOpen = () => {
    setOpen(prevState => !prevState);
    window.sidebarState[info.name] = !isOpen;
  };

  return (
    <>
      <a css={STYLES_TITLE} onClick={toggleIsOpen}>
        <ChevronDownIcon
          size={iconSize.small}
          css={[STYLES_CHEVRON_ICON, !isOpen && STYLES_CLOSED_CHEVRON_ICON]}
        />
        {info.name}
      </a>
      {isOpen && <div>{children}</div>}
    </>
  );
};
