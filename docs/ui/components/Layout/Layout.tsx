import { css } from '@emotion/react';
import { breakpoints, theme } from '@expo/styleguide';
import Head from 'next/head';
import React, { PropsWithChildren, ReactNode } from 'react';

import { Header } from '~/ui/components/Header';
import { LayoutScroll } from '~/ui/components/Layout';

type LayoutProps = PropsWithChildren<{
  /** The content within the top bar that spans the columns */
  header?: ReactNode;
  /** The content within the left column */
  navigation?: ReactNode;
  /** The content within the right column */
  sidebar?: ReactNode;
}>;

export function Layout({ header = <Header />, navigation, sidebar, children }: LayoutProps) {
  return (
    <div css={layoutStyle}>
      {/* note(simek): meh, we need to move this tag to more appropriate place, once new Layout will be used globally */}
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale = 1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
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
  backgroundColor: theme.background.default,
  '[data-expo-theme="dark"] &': {
    backgroundColor: theme.background.screen,
  },
  [`@media screen and (max-width: ${breakpoints.medium}px)`]: {
    gridTemplateAreas: `
      "header"
      "content"
    `,
    gridTemplateColumns: 'auto',
  },
});

const headerStyle = css({ gridArea: 'header' });

const navigationStyle = css({
  gridArea: 'navigation',
});

const contentStyle = css({ gridArea: 'content' });
const innerContentStyle = css({
  margin: '0 auto',
  maxWidth: breakpoints.large,
});

const sidebarStyle = css({
  gridArea: 'sidebar',
});
