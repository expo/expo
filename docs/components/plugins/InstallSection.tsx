import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import * as React from 'react';

import { usePageMetadata } from '~/providers/page-metadata';
import { Terminal } from '~/ui/components/Snippet';

const STYLES_P = css`
  line-height: 1.8rem;
  margin-top: 1.4rem;
  margin-bottom: 1.4rem;
  color: ${theme.text.default};
`;

const STYLES_BOLD = css`
  font-family: ${typography.fontFaces.medium};
  font-weight: 400;
  text-decoration: none;
  color: ${theme.link.default};
  :hover {
    text-decoration: underline;
  }
`;
const STYLES_LINK = css`
  text-decoration: none;
  color: ${theme.link.default};
  :hover {
    text-decoration: underline;
  }
`;

type Props = {
  packageName: string;
  hideBareInstructions?: boolean;
  cmd?: string[];
  href?: string;
};

const getPackageLink = (packageNames: string) =>
  `https://github.com/expo/expo/tree/main/packages/${packageNames.split(' ')[0]}`;

const InstallSection: React.FC<Props> = ({
  packageName,
  hideBareInstructions = false,
  cmd = [`$ expo install ${packageName}`],
  href = getPackageLink(packageName),
}) => (
  <div>
    <Terminal cmd={cmd} />
    {hideBareInstructions ? null : (
      <p css={STYLES_P}>
        If you're installing this in a{' '}
        <a css={STYLES_LINK} href="/introduction/managed-vs-bare/#bare-workflow">
          bare React Native app
        </a>
        , you should also follow{' '}
        <a css={STYLES_BOLD} href={href}>
          these additional installation instructions
        </a>
        .
      </p>
    )}
  </div>
);

export default InstallSection;

export const APIInstallSection: React.FC<Props> = props => {
  const { packageName } = usePageMetadata();
  return <InstallSection {...props} packageName={props.packageName ?? packageName} />;
};
