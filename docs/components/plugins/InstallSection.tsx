import { PropsWithChildren } from 'react';

import { usePageMetadata } from '~/providers/page-metadata';
import { Terminal } from '~/ui/components/Snippet';
import { A, P, DEMI, CODE } from '~/ui/components/Text';

type InstallSectionProps = PropsWithChildren<{
  packageName: string;
  hideBareInstructions?: boolean;
  cmd?: string[];
  href?: string;
}>;

const getPackageLink = (packageNames: string) =>
  `https://github.com/expo/expo/tree/main/packages/${packageNames.split(' ')[0]}`;

const getInstallCmd = (packageName: string) => `$ npx expo install ${packageName}`;

export default function InstallSection({
  packageName,
  hideBareInstructions = false,
  cmd = [getInstallCmd(packageName)],
  href = getPackageLink(packageName),
}: InstallSectionProps) {
  const { sourceCodeUrl } = usePageMetadata();

  return (
    <>
      <Terminal cmd={cmd} />
      {hideBareInstructions ? null : (
        <P>
          If you are installing this in an{' '}
          <A href="/bare/overview/">existing React Native app (bare workflow)</A>, start by{' '}
          <A href="/bare/installing-expo-modules/">
            installing <CODE>expo</CODE>
          </A>{' '}
          in your project. Then, follow the{' '}
          <A href={sourceCodeUrl ?? href}>additional instructions</A> as mentioned by library's
          README under <DEMI>"Installation in bare React Native projects"</DEMI> section.
        </P>
      )}
    </>
  );
}

export const APIInstallSection = (props: InstallSectionProps) => {
  const { packageName } = usePageMetadata();
  return <InstallSection {...props} packageName={props.packageName ?? packageName} />;
};
