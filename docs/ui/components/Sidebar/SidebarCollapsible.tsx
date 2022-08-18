import { css } from '@emotion/react';
import { theme, iconSize, spacing, ChevronDownIcon, borderRadius, shadows } from '@expo/styleguide';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { CALLOUT } from '../Text';

import stripVersionFromPath from '~/common/stripVersionFromPath';
import { NavigationRoute } from '~/types/common';

if (typeof window !== 'undefined' && !window.hasOwnProperty('sidebarState')) {
  window.sidebarState = {};
}

type Props = React.PropsWithChildren<{
  info: NavigationRoute;
}>;

export function SidebarCollapsible(props: Props) {
  const { info, children } = props;
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
      <a css={titleStyle} onClick={toggleIsOpen}>
        <div css={chevronContainerStyle}>
          <ChevronDownIcon
            size={iconSize.small}
            css={[chevronStyle, !isOpen && chevronClosedStyle]}
          />
        </div>
        <CALLOUT weight="medium">{info.name}</CALLOUT>
      </a>
      {isOpen && <div>{children}</div>}
    </>
  );
}

const titleStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1.5],
  position: 'relative',
  marginBottom: spacing[2],
  marginLeft: -spacing[1.5],
  marginRight: -spacing[1.5],
  userSelect: 'none',
  transition: '100ms',
  padding: `${spacing[1.5]}px ${spacing[1.5]}px`,

  ':hover': {
    cursor: 'pointer',
    backgroundColor: theme.background.tertiary,
    borderRadius: borderRadius.medium,
    transition: '100ms',
  },
});
const chevronContainerStyle = css({
  backgroundColor: theme.background.default,
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.small,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: shadows.micro,
  height: 18,
  width: 18,

  '[data-expo-theme="dark"] &': {
    backgroundColor: theme.background.tertiary,
  },
});

const chevronStyle = css({
  transition: '100ms ease transform',
});

const chevronClosedStyle = css({
  transform: 'rotate(-90deg)',
});
