import { css } from '@emotion/react';
import { borderRadius, shadows, spacing, theme, typography } from '@expo/styleguide';
import React from 'react';

import { NavigationRenderProps } from './types';

import { A, CALLOUT } from '~/ui/components/Text';

export function PageLink({ route, isActive }: NavigationRenderProps) {
  if (route.type !== 'page') {
    throw new Error(`Navigation node is not a page`);
  }

  return (
    <A css={[linkStyle, isActive && linkStyleActive]} href={route.href}>
      <CALLOUT css={[textStyle, isActive && textStyleActive]} tag="span">
        {route.sidebarTitle || route.name}
      </CALLOUT>
    </A>
  );
}

const linkStyle = css({
  display: 'block',
  borderRadius: borderRadius.medium,
  padding: spacing[1.5],
  margin: `${spacing[1]}px ${spacing[4]}px`,
});

const linkStyleActive = css({
  backgroundColor: theme.background.default,
  boxShadow: shadows.micro,
});

const textStyle = css({
  color: theme.text.secondary,
});

const textStyleActive = css({
  ...typography.utility.weight.medium,
  color: theme.text.default,
});
