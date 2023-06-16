import { css } from '@emotion/react';
import { breakpoints, spacing } from '@expo/styleguide-base';
import { BuildIcon, GithubIcon } from '@expo/styleguide-icons';

import { A, CALLOUT, H1 } from '~/ui/components/Text';

type Props = {
  title?: string;
  packageName?: string;
  sourceCodeUrl?: string;
  iconUrl?: string;
};

export const PageTitle = ({ title, packageName, iconUrl, sourceCodeUrl }: Props) => (
  <div className="flex my-2 items-center justify-between max-xl-gutters:flex-col max-xl-gutters:items-start">
    <H1 className="!my-0">
      {iconUrl && <img src={iconUrl} css={titleIconStyle} alt={`Expo ${title} icon`} />}
      {packageName && packageName.startsWith('expo-') && 'Expo '}
      {title}
    </H1>
    {packageName && (
      <span css={linksContainerStyle}>
        {sourceCodeUrl && (
          <A
            isStyled
            openInNewTab
            href={sourceCodeUrl}
            css={linkStyle}
            title={`View source code of ${packageName} on GitHub`}>
            <GithubIcon className="text-icon-secondary" />
            <CALLOUT theme="secondary">GitHub</CALLOUT>
          </A>
        )}
        <A
          isStyled
          openInNewTab
          href={`https://www.npmjs.com/package/${packageName}`}
          css={linkStyle}
          title="View package in npm Registry">
          <BuildIcon className="text-icon-secondary" />
          <CALLOUT theme="secondary">npm</CALLOUT>
        </A>
      </span>
    )}
  </div>
);

const titleIconStyle = css({
  float: 'left',
  marginRight: spacing[3.5],
  position: 'relative',
  top: -2,
  width: 42,
  height: 42,
});

const linksContainerStyle = css({
  display: 'flex',
  gap: spacing[6],

  [`@media screen and (max-width: ${breakpoints.large}px)`]: {
    marginTop: spacing[3],
    marginBottom: spacing[1],
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
