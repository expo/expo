import { css } from '@emotion/react';
import {
  borderRadius,
  spacing,
  theme,
  ArrowRightIcon,
  iconSize,
  shadows,
  ArrowUpRightIcon,
  breakpoints,
} from '@expo/styleguide';
import type { IconProps } from '@expo/styleguide/dist/types';
import React, { ComponentType, PropsWithChildren, ReactNode } from 'react';

import { A, DEMI, P } from '~/ui/components/Text';

type BoxLinkProps = PropsWithChildren<{
  title: string;
  description: string | ReactNode;
  href?: string;
  testID?: string;
  Icon?: ComponentType<IconProps>;
}>;

export function BoxLink({ title, description, href, testID, Icon }: BoxLinkProps) {
  const isExternal = Boolean(href && href.startsWith('http'));
  const ArrowIcon = isExternal ? ArrowUpRightIcon : ArrowRightIcon;
  return (
    <A href={href} css={tileContainerStyle} data-testid={testID} openInNewTab={isExternal} isStyled>
      <div css={tileContentWrapperStyle}>
        {Icon && (
          <div css={tileIconBackgroundStyle}>
            <Icon width={iconSize.md} />
          </div>
        )}
        <div>
          <DEMI>{title}</DEMI>
          <P>{description}</P>
        </div>
      </div>
      <ArrowIcon css={arrowIconStyle} color={theme.icon.secondary} />
    </A>
  );
}

const tileContainerStyle = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.md,
  padding: `${spacing[3]}px ${spacing[4]}px`,
  marginBottom: spacing[3],

  ':hover': {
    boxShadow: shadows.xs,
  },
});

const tileContentWrapperStyle = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[4],
});

const tileIconBackgroundStyle = css({
  display: 'flex',
  backgroundColor: theme.background.element,
  borderRadius: borderRadius.md,
  alignSelf: 'center',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 36,
  height: 36,

  [`@media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px)`]: {
    alignSelf: 'flex-start',
  },
});

const arrowIconStyle = css({
  alignSelf: 'center',
  alignContent: 'flex-end',
  minWidth: iconSize.md,
  marginLeft: spacing[3],
});
