import { PropsWithChildren } from 'react';

import { usePageMetadata } from '~/providers/page-metadata';
import { Terminal } from '~/ui/components/Snippet';
import { A, P, DEMI } from '~/ui/components/Text';

type InstallSectionProps = PropsWithChildren<{
  packageName: string;
  hideBareInstructions?: boolean;
  cmd?: string[];
  href?: string;
}>;

const getPackageLink = (packageNames: string) =>
  `https://github.com/expo/expo/tree/main/packages/${packageNames.split(' ')[0]}`;

const getInstallCmd = (packageName: string) => `$ npx expo install ${packageName}`;

const InstallSection = ({
  packageName,
  hideBareInstructions = false,
  cmd = [getInstallCmd(packageName)],
  href = getPackageLink(packageName),
}: InstallSectionProps) => {
  const { sourceCodeUrl } = usePageMetadata();

  return (
    <>
      <Terminal cmd={cmd} />
      {hideBareInstructions ? null : (
        <P>
          If you're installing this in a{' '}
          <A href="/archive/managed-vs-bare/#bare-workflow">bare React Native app</A>, you should
          also follow{' '}
          <A href={sourceCodeUrl ?? href}>
            <DEMI>these additional installation instructions</DEMI>
          </A>
          .
        </P>
      )}
    </>
  );
};

export default InstallSection;

export const APIInstallSection = (props: InstallSectionProps) => {
  const { packageName } = usePageMetadata();
  return <InstallSection {...props} packageName={props.packageName ?? packageName} />;
};
