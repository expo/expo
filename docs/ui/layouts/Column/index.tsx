import { css } from '@emotion/react';
import { breakpoints, theme } from '@expo/styleguide';
import React, { PropsWithChildren, ReactNode } from 'react';

import { Scroll } from './Scroll';

export { Scroll } from './Scroll';

type ColumnLayoutProps = PropsWithChildren<{
  /** The navigation sidebar content, either in the right sidebar or overlayed in mobile */
  navigation: ReactNode;
  /** The optional table of contents sidebar, adds padding to main content when omitted */
  sidebar?: ReactNode;
}>;

export function ColumnLayout({ navigation, sidebar, children }: ColumnLayoutProps) {
  return (
    <div css={containerStyle}>
      <div css={navigationColumnStyle}>{navigation}</div>
      <div css={articleColumnStyle}>
        <Scroll css={!sidebar && paddedArticleColumnStyle}>
          <div css={contentBehaviorStyle}>{children}</div>
        </Scroll>
      </div>
      <div css={sidebarColumnStyle}>{sidebar}</div>
    </div>
  );
}

// TODO(cedric): check if we can centralize or move it somewhere else
const columnWidth = 200;
const navigationMinimumWidth = 768;
const sidebarMinimalWidth = breakpoints.medium;

const containerStyle = css({
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
});

const navigationColumnStyle = css({
  backgroundColor: theme.background.secondary,
  flex: 0,
  flexBasis: columnWidth,

  [`@media screen and (max-width: ${navigationMinimumWidth}px)`]: {
    display: 'none',
  },
});

const articleColumnStyle = css({
  flex: 1,
});

const paddedArticleColumnStyle = css({
  // Apply right padding to avoid jumping content when the sidebar is toggled hidden/visible
  paddingRight: columnWidth,
  // But when the sidebar should never be shown, don't add padding
  [`@media screen and (max-width: ${sidebarMinimalWidth}px)`]: {
    paddingRight: 0,
  },
});

const sidebarColumnStyle = css({
  flexBasis: `${columnWidth}px`,

  // Hide the sidebar whenever its empty, or below the media query threshold
  '&:empty': { display: 'none' },
  [`@media screen and (max-width: ${sidebarMinimalWidth}px)`]: {
    display: 'none',
  },
});

const contentBehaviorStyle = css({
  maxWidth: breakpoints.large,
  margin: '0 auto',
});
