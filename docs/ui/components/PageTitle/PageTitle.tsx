import { css } from '@emotion/react';
import { breakpoints, BuildIcon, GithubIcon, spacing, theme } from '@expo/styleguide';

import { A, CALLOUT, H1 } from '~/ui/components/Text';

type Props = {
  title?: string;
  packageName?: string;
  sourceCodeUrl?: string;
  iconUrl?: string;
};

export const PageTitle = ({ title, packageName, iconUrl, sourceCodeUrl }: Props) => (
  <H1>
    {iconUrl && <img src={iconUrl} css={titleIconStyle} alt={`Expo ${title} icon`} />}
    {packageName && packageName.startsWith('expo-') && 'Expo '}
    {title}
    {packageName && (
      <span css={linksContainerStyle}>
        {sourceCodeUrl && (
          <A
            isStyled
            openInNewTab
            href={sourceCodeUrl}
            css={linkStyle}
            title={`View source code of ${packageName} on GitHub`}>
            <GithubIcon color={theme.icon.secondary} title="" />
            <CALLOUT theme="secondary">GitHub</CALLOUT>
          </A>
        )}
        <A
          isStyled
          openInNewTab
          href={`https://www.npmjs.com/package/${packageName}`}
          css={linkStyle}
          title="View package in npm Registry">
          <BuildIcon color={theme.icon.secondary} title="" />
          <CALLOUT theme="secondary">npm</CALLOUT>
        </A>
      </span>
    )}
  </H1>
);

const titleIconStyle = css({
  float: 'left',
  marginRight: spacing[3.5],
  position: 'relative',
  top: -5,
  width: 48,
  height: 48,

  [`@media screen and (max-width: ${breakpoints.medium}px)`]: {
    width: 42,
    height: 42,
    top: -4,
  },
});

const linksContainerStyle = css({
  display: 'flex',
  float: 'right',
  gap: spacing[6],
  marginTop: -spacing[0.5],

  [`@media screen and (max-width: ${breakpoints.large}px)`]: {
    float: 'none',
    clear: 'left',
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
    marginTop: 0,
  },
});

const linkStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[0.5],
  alignItems: 'center',
  minWidth: 44,

  [`@media screen and (max-width: ${breakpoints.large}px)`]: {
    flexDirection: 'row',
    gap: spacing[2],
  },
});
