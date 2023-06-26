import { css } from '@emotion/react';
import { theme, typography, Logo as LogoIcon, WordMarkLogo, LinkBase } from '@expo/styleguide';
import { breakpoints, spacing, borderRadius } from '@expo/styleguide-base';

import { DocumentationIcon } from '~/ui/components/Sidebar/icons/Documentation';

type Props = {
  subgroup?: string;
};

export const Logo = ({ subgroup }: Props) => (
  <div className="flex flex-1 items-center gap-4">
    <LinkBase css={linkStyle} href="https://expo.dev">
      <WordMarkLogo
        className="w-[72px] mt-[1px] h-5 text-default my-1"
        css={hideOnMobile}
        title="Expo"
      />
      <LogoIcon className="icon-lg mt-[1px] text-default" css={showOnMobile} title="Expo" />
    </LinkBase>
    <LinkBase css={linkStyle} href={subgroup ? `/${subgroup.toLowerCase()}/` : '/'}>
      <div css={iconContainer}>
        <DocumentationIcon className="icon-sm" />
      </div>
      <span css={subtitleStyle}>{subgroup ?? 'Docs'}</span>
    </LinkBase>
  </div>
);

const linkStyle = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  text-decoration: none;
  user-select: none;
  gap: ${spacing[2]}px;
  outline-offset: 5px;
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
