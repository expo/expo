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
      <div>
        <HEADLINE tag="span">{title}</HEADLINE>
        <P>{description}</P>
      </div>
      <ArrowRightIcon css={iconStyle} color={theme.icon.secondary} />
    </A>
  );
}

const tileContainerStyle = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.medium,
  padding: `${spacing[3]}px ${spacing[4]}px`,
  marginBottom: spacing[3],

  ':hover': {
    boxShadow: shadows.micro,
  },
});

const iconStyle = css({
  alignSelf: 'center',
  alignContent: 'flex-end',
  minWidth: iconSize.regular,
  marginLeft: spacing[3],
});
