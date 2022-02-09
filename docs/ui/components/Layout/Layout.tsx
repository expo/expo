import { css } from '@emotion/react';
import { breakpoints } from '@expo/styleguide';
import React, { PropsWithChildren, ReactNode } from 'react';

import { LayoutScroll } from './LayoutScroll';

type LayoutProps = PropsWithChildren<{
  /** The content within the top bar that spans the columns */
  header: ReactNode;
  /** The content within the left column */
  navigation?: ReactNode;
  /** The content within the right column */
  sidebar?: ReactNode;
}>;

export function Layout({ header, navigation, sidebar, children }: LayoutProps) {
  return (
    <div css={layoutStyle}>
      <div css={headerStyle}>{header}</div>
      <div css={navigationStyle}>{navigation}</div>
      <div css={contentStyle}>
        <LayoutScroll>
          <div css={innerContentStyle}>{children}</div>
        </LayoutScroll>
      </div>
      <div css={sidebarStyle}>{sidebar}</div>
    </div>
  );
}

const layoutStyle = css({
  display: 'grid',
  height: '100vh',
  gridTemplateRows: '60px calc(100vh - 60px)',
  gridTemplateColumns: 'min-content auto min-content',
  gridTemplateAreas: `
    "header header header"
    "navigation content sidebar"
  `,
});

const headerStyle = css({ gridArea: 'header' });

const navigationStyle = css({
  gridArea: 'navigation',
  [`@media screen and (max-width: 768px)`]: {
    display: 'none',
  },
});

const contentStyle = css({ gridArea: 'content' });
const innerContentStyle = css({
  margin: '0 auto',
  maxWidth: breakpoints.large,
  height: '100%',
  overflowY: 'visible',
});

const sidebarStyle = css({
  gridArea: 'sidebar',
  [`@media screen and (max-width: ${breakpoints.medium}px)`]: {
    display: 'none',
  },
});
