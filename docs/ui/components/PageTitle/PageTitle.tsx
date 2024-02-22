import { css } from '@emotion/react';
import { breakpoints, spacing } from '@expo/styleguide-base';
import { BuildIcon, GithubIcon } from '@expo/styleguide-icons';
import { formatDistance, subDays } from 'date-fns';
import { useEffect, useState } from 'react';

import { A, CALLOUT, FOOTNOTE, H1 } from '~/ui/components/Text';

type Props = {
  title?: string;
  packageName?: string;
  sourceCodeUrl?: string;
  iconUrl?: string;
};

export const PageTitle = ({ title, packageName, iconUrl, sourceCodeUrl }: Props) => {
  const [lastUpdated, setLastUpdated] = useState('');
  const blah = formatDistance(subDays(new Date(), 3), new Date(), { addSuffix: true });

  useEffect(() => {
    if (sourceCodeUrl) {
      fetch(`https://api.github.com/repos/${sourceCodeUrl.split('github.com/')[1]}/commits`)
        .then(response => response.json())
        .then(data => {
          if (data.length) {
            setLastUpdated(
              formatDistance(new Date(data[0].commit.author.date), new Date(), { addSuffix: true })
            );
          }
        });
    }
  }, []);
  return (
    <>
      {sourceCodeUrl ? (
        <div className="flex items-center justify-start max-xl-gutters:flex-col max-xl-gutters:items-start">
          {lastUpdated !== '' ? (
            <FOOTNOTE>Last updated: {lastUpdated}</FOOTNOTE>
          ) : (
            <>
              <FOOTNOTE>Last updated:</FOOTNOTE>
              <div className="ml-2 animate-pulse rounded-md bg-palette-gray4 w-32 h-3" />
            </>
          )}
        </div>
      ) : null}
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
                <CALLOUT crawlable={false} theme="secondary">
                  GitHub
                </CALLOUT>
              </A>
            )}
            <A
              isStyled
              openInNewTab
              href={`https://www.npmjs.com/package/${packageName}`}
              css={linkStyle}
              title="View package in npm Registry">
              <BuildIcon className="text-icon-secondary" />
              <CALLOUT crawlable={false} theme="secondary">
                npm
              </CALLOUT>
            </A>
          </span>
        )}
      </div>
    </>
  );
};

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
