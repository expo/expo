import { PropsWithChildren } from 'react';

import { usePageMetadata } from '~/providers/page-metadata';
import { Terminal, type PackageManagerCommandSet } from '~/ui/components/Snippet';
import { A, P, CODE } from '~/ui/components/Text';

type InstallSectionProps = PropsWithChildren<{
  packageName: string;
  hideBareInstructions?: boolean;
  cmd?: string[] | PackageManagerCommandSet;
  href?: string;
}>;

const getInstallCmd = (packageName: string): PackageManagerCommandSet => ({
  npm: [`$ npx expo install ${packageName}`],
  yarn: [`$ yarn expo install ${packageName}`],
  pnpm: [`$ pnpm expo install ${packageName}`],
  bun: [`$ bun expo install ${packageName}`],
});

export default function InstallSection({
  packageName,
  hideBareInstructions = false,
  cmd = getInstallCmd(packageName),
  href,
}: InstallSectionProps) {
  if (href) {
    return (
      <>
        <Terminal cmd={cmd} />
        <P>
          If you are installing this in an <A href="/bare/overview/">existing React Native app</A>,{' '}
          make sure to{' '}
          <A href="/bare/installing-expo-modules/">
            install <CODE>expo</CODE>
          </A>{' '}
          in your project. Then, follow the <A href={href}>installation instructions</A> provided in
          the library's README or documentation.
        </P>
      </>
    );
  }

  return (
    <>
      <Terminal cmd={cmd} />
      {hideBareInstructions ? null : (
        <P>
          If you are installing this in an <A href="/bare/overview/">existing React Native app</A>,{' '}
          make sure to{' '}
          <A href="/bare/installing-expo-modules/">
            install <CODE>expo</CODE>
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
