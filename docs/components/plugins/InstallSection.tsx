import { PropsWithChildren } from 'react';

import { usePageMetadata } from '~/providers/page-metadata';
import { Terminal } from '~/ui/components/Snippet';
import { A, P, CODE } from '~/ui/components/Text';

type InstallSectionProps = PropsWithChildren<{
  packageName: string;
  hideBareInstructions?: boolean;
  cmd?: string[];
}>;

const getInstallCmd = (packageName: string) => `$ npx expo install ${packageName}`;

export default function InstallSection({
  packageName,
  hideBareInstructions = false,
  cmd = [getInstallCmd(packageName)],
}: InstallSectionProps) {
  return (
    <>
      <Terminal cmd={cmd} />
      {hideBareInstructions ? null : (
        <P>
          If you are installing this in an <A href="/bare/overview/">existing React Native app</A>,
          start by{' '}
          <A href="/bare/installing-expo-modules/">
            installing <CODE>expo</CODE>
          </A>{' '}
          in your project.
        </P>
      )}
    </>
  );
}

export const APIInstallSection = (props: InstallSectionProps) => {
  const { packageName } = usePageMetadata();
  return <InstallSection {...props} packageName={props.packageName ?? packageName} />;
};
