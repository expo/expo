import { css } from '@emotion/react';
import { theme, iconSize, spacing, ChevronDownIcon, borderRadius, shadows } from '@expo/styleguide';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { ButtonBase } from '../Button';
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
      <ButtonBase css={titleStyle} aria-expanded={isOpen ? 'true' : 'false'} onClick={toggleIsOpen}>
        <div css={chevronContainerStyle}>
          <ChevronDownIcon
            size={iconSize.tiny}
            css={[chevronStyle, !isOpen && chevronClosedStyle]}
          />
        </div>
        <CALLOUT weight="medium">{info.name}</CALLOUT>
      </ButtonBase>
      {isOpen && <div aria-hidden={!isOpen ? 'true' : 'false'}>{children}</div>}
    </>
  );
}

const titleStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1.5],
  position: 'relative',
  marginBottom: spacing[2],
  userSelect: 'none',
  transition: '100ms',
  padding: `${spacing[1.5]}px ${spacing[3]}px`,
  width: '100%',

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
  height: 20,
  width: 20,
  marginRight: spacing[1],
});

const chevronStyle = css({
  transition: '100ms ease transform',
  transform: 'translateX(-0.5px)',
});

const chevronClosedStyle = css({
  transform: 'rotate(-90deg)',
});
