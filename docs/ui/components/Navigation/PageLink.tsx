import { css } from '@emotion/react';
import { borderRadius, iconSize, shadows, spacing, theme, typography } from '@expo/styleguide';
import React from 'react';

import { NavigationRenderProps } from './types';

import { A, CALLOUT } from '~/ui/components/Text';

export function PageLink({ route, isActive }: NavigationRenderProps) {
  if (route.type !== 'page') {
    throw new Error(`Navigation route is not a page`);
  }

  return (
    <A css={[linkStyle, isActive && linkStyleActive]} href={route.href}>
      <i css={[markerStyle, isActive && markerStyleActive]} />
      <CALLOUT css={[textStyle, isActive && textStyleActive]} tag="span">
        {route.sidebarTitle || route.name}
      </CALLOUT>
    </A>
  );
}

const linkStyle = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: borderRadius.medium,
  padding: `${spacing[1.5]}px ${spacing[2]}px`,
  margin: `${spacing[1]}px ${spacing[4]}px`,
});

const linkStyleActive = css({
  boxShadow: shadows.micro,
  backgroundColor: theme.background.default,
  '[data-expo-theme="dark"] &': {
    backgroundColor: theme.background.tertiary,
  },
});

const markerStyle = css({
  flexShrink: 0,
  backgroundColor: theme.icon.secondary,
  borderRadius: iconSize.micro,
  width: iconSize.micro / 2,
  height: iconSize.micro / 2,
  marginRight: spacing[2],
  visibility: 'hidden',
});

const markerStyleActive = css({
  visibility: 'visible',
});

const textStyle = css({
  color: theme.text.secondary,
});

const textStyleActive = css({
  ...typography.utility.weight.medium,
  color: theme.text.default,
});
