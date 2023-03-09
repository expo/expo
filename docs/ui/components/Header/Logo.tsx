import { css } from '@emotion/react';
import { theme, typography, Logo as LogoIcon, WordMarkLogo, LinkBase } from '@expo/styleguide';
import { breakpoints, spacing, borderRadius } from '@expo/styleguide-base';
import { ChevronRightIcon } from '@expo/styleguide-icons';

import { DocumentationIcon } from '~/ui/components/Sidebar/icons/Documentation';

type Props = {
  subgroup?: string;
};

export const Logo = ({ subgroup }: Props) => (
  <div className="flex items-center gap-4">
    <LinkBase css={linkStyle} href="https://expo.dev">
      <WordMarkLogo
        className="w-[72px] mt-[1px] h-5 text-default"
        css={hideOnMobile}
        title="Expo"
      />
      <LogoIcon className="icon-lg mt-[1px] text-default" css={showOnMobile} title="Expo" />
    </LinkBase>
    <LinkBase css={linkStyle} href="/">
      <div css={iconContainer}>
        <DocumentationIcon className="icon-sm" />
      </div>
      <span css={subtitleStyle}>Docs</span>
    </LinkBase>
    {subgroup && (
      <>
        <ChevronRightIcon className="text-icon-secondary" css={[chevronStyle, hideOnMobile]} />
        <span css={[subtitleStyle, hideOnMobile]}>{subgroup}</span>
      </>
    )}
  </div>
);

const linkStyle = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  text-decoration: none;
  user-select: none;
  gap: ${spacing[2]}px;
`;

const chevronStyle = css`
  margin: 0 ${-spacing[2]}px;

  @media screen and (max-width: ${breakpoints.medium}px) {
    margin-left: ${spacing[0.5]}px;
  }
`;

const hideOnMobile = css`
  @media screen and (max-width: ${breakpoints.medium}px) {
    display: none;
  }
`;

const showOnMobile = css`
  display: none;

  @media screen and (max-width: ${breakpoints.medium}px) {
    display: block;
    margin-top: 0;
    margin-right: ${spacing[1.5]}px;
  }
`;

const subtitleStyle = css`
  color: ${theme.text.default};
  font-weight: 500;
  user-select: none;
  ${typography.fontSizes[18]}
`;

const iconContainer = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.blue4,
  borderRadius: borderRadius.sm,
  height: 24,
  width: 24,
});
