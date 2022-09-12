import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import * as React from 'react';

import { PageApiVersionContext } from '~/providers/page-api-version';
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

type InstallSectionProps = React.PropsWithChildren<{
  packageName: string;
  hideBareInstructions?: boolean;
  cmd?: string[];
  href?: string;
}>;

const getPackageLink = (packageNames: string) =>
  `https://github.com/expo/expo/tree/main/packages/${packageNames.split(' ')[0]}`;

function getInstallCmd(packageName: string) {
  return `$ npx expo install ${packageName}`;
}

const InstallSection = ({
  packageName,
  hideBareInstructions = false,
  cmd = [getInstallCmd(packageName)],
  href = getPackageLink(packageName),
}: InstallSectionProps) => {
  const { sourceCodeUrl } = usePageMetadata();
  const { version } = React.useContext(PageApiVersionContext);

  // Recommend just `expo install` for SDK 43, 44, and 45.
  // TODO: remove this when we drop SDK 45 from docs
  if (version.startsWith('v43') || version.startsWith('v44') || version.startsWith('v45')) {
    if (cmd[0] === getInstallCmd(packageName)) {
      cmd[0] = cmd[0].replace('npx expo', 'expo');
    }
  }

  return (
    <>
      <Terminal cmd={cmd} />
      {hideBareInstructions ? null : (
        <p css={STYLES_P}>
          If you're installing this in a{' '}
          <a css={STYLES_LINK} href="/introduction/managed-vs-bare/#bare-workflow">
            bare React Native app
          </a>
          , you should also follow{' '}
          <a css={STYLES_BOLD} href={sourceCodeUrl ?? href}>
            these additional installation instructions
          </a>
          .
        </p>
      )}
    </>
  );
};

export default InstallSection;

export const APIInstallSection = (props: InstallSectionProps) => {
  const { packageName } = usePageMetadata();
  return <InstallSection {...props} packageName={props.packageName ?? packageName} />;
};
