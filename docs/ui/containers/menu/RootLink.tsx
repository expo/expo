import { css } from '@emotion/react';
import { iconSize, palette, theme } from '@expo/styleguide';
import { IconProps } from '@expo/styleguide/dist/types';
import React from 'react';

import { Link, LinkProps } from '~/ui/components/Link';
import { P } from '~/ui/components/Text';

type RootLinkProps = LinkProps & {
  icon: (props: IconProps) => JSX.Element;
  isActive?: boolean;
};

export const RootLink = ({ children, icon, isActive = false, ...rest }: RootLinkProps) => {
  const IconComponent = icon;

  return (
    <Link css={[linkStyle, isActive && activeLinkStyle]} {...rest}>
      <IconComponent
        css={[iconStyle, isActive && activeIconStyle]}
        size={iconSize.small}
        color="currentColor"
      />
      <P css={[textStyle, isActive && activeTextStyle]} size="small">
        {children}
      </P>
    </Link>
  );
};

const linkStyle = css`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  text-decoration: none;
  border-radius: 9999px;
`;

const activeLinkStyle = css`
  background-color: ${palette.light.primary[100]};

  [data-expo-theme='dark'] & {
    background-color: ${palette.dark.gray[400]};
  }
`;

const iconStyle = css`
  color: ${theme.icon.default};
`;

const activeIconStyle = css`
  color: ${palette.light.primary[700]};

  [data-expo-theme='dark'] & {
    color: ${theme.icon.default};
  }
`;

const textStyle = css`
  color: ${theme.text.secondary};
  margin-left: 0.5rem;
  line-height: 130%;
`;

const activeTextStyle = css`
  color: ${palette.light.primary[900]};

  [data-expo-theme='dark'] & {
    color: ${theme.text.default};
  }
`;
