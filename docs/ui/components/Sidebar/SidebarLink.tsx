import { css } from '@emotion/react';
import { theme, typography, spacing } from '@expo/styleguide';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import * as React from 'react';

import stripVersionFromPath from '~/common/stripVersionFromPath';
import { NavigationRoute } from '~/types/common';

type SidebarLinkProps = React.PropsWithChildren<{
  info: NavigationRoute;
}>;

export const SidebarLink = ({ info, children }: SidebarLinkProps) => {
  const { asPath, pathname } = useRouter();

  if (info.hidden) {
    return null;
  }

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

  const customDataAttributes = isSelected
    ? {
        'data-sidebar-anchor-selected': true,
      }
    : {};

  return (
    <div css={STYLES_CONTAINER}>
      <NextLink href={info.href as string} as={info.as || info.href} passHref>
        <a {...customDataAttributes} css={[STYLES_LINK, isSelected && STYLES_LINK_ACTIVE]}>
          {isSelected && <div css={STYLES_ACTIVE_BULLET} />}
          {children}
        </a>
      </NextLink>
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
  align-items: flex-start;
  padding-left: ${spacing[4] + spacing[0.5]}px;

  &:hover {
    color: ${theme.link.default};
  }
`;

const STYLES_LINK_ACTIVE = css`
  font-family: ${typography.fontFaces.medium};
  color: ${theme.link.default};
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
  background-color: ${theme.link.default};
  border-radius: 100%;
  margin: ${spacing[2]}px ${spacing[1.5]}px;
`;
