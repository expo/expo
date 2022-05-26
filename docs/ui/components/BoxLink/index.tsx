import { css } from '@emotion/react';
import { borderRadius, spacing, theme, ArrowRightIcon, iconSize, shadows } from '@expo/styleguide';
import React, { PropsWithChildren, ReactNode } from 'react';

import { A, HEADLINE, P } from '~/ui/components/Text';

type BoxLinkProps = PropsWithChildren<{
  title: string;
  description: string | ReactNode;
  href?: string;
  testID?: string;
}>;

export function BoxLink({ title, description, href, testID }: BoxLinkProps) {
  return (
    <A href={href} css={tileContainerStyle} data-testid={testID}>
      <HEADLINE tag="span">{title}</HEADLINE>
      <P>{description}</P>
      <ArrowRightIcon css={iconStyle} color={theme.icon.secondary} size={iconSize.large} />
    </A>
  );
}

const tileContainerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.medium,
  padding: `${spacing[3]}px ${spacing[12]}px ${spacing[3]}px ${spacing[4]}px`,
  marginBottom: spacing[3],

  ':hover': {
    boxShadow: shadows.micro,
  },
});

const iconStyle = css({
  position: 'absolute',
  right: spacing[4],
  top: `calc((100% / 2) - ${iconSize.large / 2}px)`,
});
