import { css, Global } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { PropsWithChildren, ReactNode } from 'react';

type HeaderLayoutProps = PropsWithChildren<{
  /** The top bar content, with fixed height */
  header: ReactNode;
}>;

export function HeaderLayout(props: HeaderLayoutProps) {
  return (
    <div css={containerStyle}>
      <Global styles={globalStyle} />
      <header css={headerStyle} role="banner">
        {props.header}
      </header>
      <main css={contentStyle}>{props.children}</main>
    </div>
  );
}

const globalStyle = css({
  'html, body, #__next': {
    height: '100%',
    backgroundColor: theme.background.default,
  },
});

const containerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: '100%',
});

const headerStyle = css({
  flexShrink: 0,
  flexBasis: '60px', // TODO(cedric): find a better place for this
});

const contentStyle = css({
  flex: 1,
  height: 'calc(100% - 60px)',
});
