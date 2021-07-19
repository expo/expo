import { css } from '@emotion/react';
import { borderRadius, theme } from '@expo/styleguide';
import React from 'react';

import { Link, LinkProps } from '~/ui/components/Link';
import { P } from '~/ui/components/Text';

type GroupLinkProps = LinkProps & {
  isActive?: boolean;
};

export const GroupLink = ({ children, isActive = false, ...rest }: GroupLinkProps) => (
  <Link css={[linkStyle, isActive && activeLinkStyle]} href="/" {...rest}>
    <P size="small" css={textStyle}>
      {children}
    </P>
  </Link>
);

const linkStyle = css`
  display: block;
  padding: 0.5rem 1.5rem;
  text-decoration: none;
  border-radius: ${borderRadius.medium}px;
  color: ${theme.text.secondary};

  &:hover {
    background-color: ${theme.background.tertiary};
    color: ${theme.text.default};
  }
`;

const activeLinkStyle = css`
  background-color: ${theme.background.tertiary};
  color: ${theme.text.default};
  font-weight: 500;
`;

const textStyle = css`
  color: inherit;
  font-weight: inherit;
`;
