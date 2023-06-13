import { css } from '@emotion/react';
import { shadows, theme } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';

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
  borderRadius: borderRadius.md,
  padding: `${spacing[1.5]}px ${spacing[2]}px`,
  margin: `${spacing[1]}px ${spacing[4]}px`,
});

const linkStyleActive = css({
  boxShadow: shadows.xs,
  backgroundColor: theme.background.default,
  '.dark-theme &': {
    backgroundColor: theme.background.element,
  },
});

const markerStyle = css({
  flexShrink: 0,
  backgroundColor: theme.icon.secondary,
  borderRadius: '100%',
  width: 4,
  height: 4,
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
  fontWeight: 500,
  color: theme.text.default,
});
