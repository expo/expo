import { css } from '@emotion/react';
import { spacing, theme } from '@expo/styleguide';
import React from 'react';

import { Link, LinkProps } from '~/ui/components/Link';
import { textStyles } from '~/ui/foundations/typography';

type TocLinkProps = LinkProps & {
  depth: number;
  isActive?: boolean;
};

export const TocLink = ({ depth, isActive, ...rest }: TocLinkProps) => (
  <Link
    {...rest}
    css={[linkStyle, isActive && { color: theme.text.default }]}
    style={{ paddingLeft: depth * spacing[4] }}
  />
);

const linkStyle = css`
  ${textStyles.psmall}
  color: ${theme.text.secondary};
  text-decoration: none;
  display: inline-block;
  padding: ${spacing[1]}px 0;
`;
