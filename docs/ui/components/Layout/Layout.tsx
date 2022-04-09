import { css, Global } from '@emotion/react';
import { breakpoints, spacing, theme } from '@expo/styleguide';
import React, { PropsWithChildren, ReactNode } from 'react';

import { Header } from '~/ui/components/Header';
import { LayoutScroll } from '~/ui/components/Layout';

type LayoutProps = PropsWithChildren<{
  // The content within the top bar that spans the columns
  header?: ReactNode;
  // The content within the left column
  navigation?: ReactNode;
  // The content within the right column
  sidebar?: ReactNode;
}>;

export const Layout = ({ header = <Header />, navigation, sidebar, children }: LayoutProps) => (
  <>
    <Global
      styles={css({
        // Ensure correct background for Overscroll
        '[data-expo-theme="dark"] body': {
          backgroundColor: theme.background.screen,
        },
      })}
    />
    <header css={headerStyle}>{header}</header>
    <main css={layoutStyle}>
      {navigation && <nav css={navigationStyle}>{navigation}</nav>}
      <LayoutScroll>
        <article css={innerContentStyle}>{children}</article>
      </LayoutScroll>
      {sidebar && <aside css={asideStyle}>{sidebar}</aside>}
    </main>
  </>
);

const HEADER_HEIGHT = 60;

const layoutStyle = css({
  display: 'flex',
  alignItems: 'stretch',
  maxHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
  marginTop: HEADER_HEIGHT,
  backgroundColor: theme.background.default,
  '[data-expo-theme="dark"] &': {
    backgroundColor: theme.background.screen,
  },
  [`@media screen and (max-width: ${breakpoints.medium}px)`]: {
    // Ditch inner scroll on mobile, which results in weird bugs
    maxHeight: 'none',
  },
});

const headerStyle = css({
  position: 'fixed',
  top: 0,
  width: '100%',
  height: HEADER_HEIGHT,
  zIndex: 100,
});

const navigationStyle = css({
  flexBasis: 256,
  [`@media screen and (max-width: ${breakpoints.medium}px)`]: {
    display: 'none',
  },
});

const innerContentStyle = css({
  margin: '0 auto',
  maxWidth: breakpoints.large,
  padding: `${spacing[8]}px ${spacing[4]}px`,
});

const asideStyle = css({
  flexBasis: 288,
  [`@media screen and (max-width: ${breakpoints.medium}px)`]: {
    display: 'none',
  },
});
