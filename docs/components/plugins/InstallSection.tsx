import { PropsWithChildren } from 'react';

import { usePageApiVersion } from '~/providers/page-api-version';
import { usePageMetadata } from '~/providers/page-metadata';
import versions from '~/public/static/constants/versions.json';
import { Terminal, type PackageManagerCommandSet } from '~/ui/components/Snippet';
import { Tab, Tabs } from '~/ui/components/Tabs';
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

type APIInstallSectionProps = Omit<InstallSectionProps, 'packageName'> & { packageName?: string };

export const APIInstallSection = (props: APIInstallSectionProps) => {
  const { packageName, exampleName } = usePageMetadata();
  const { version } = usePageApiVersion();
  const resolvedPackageName = props.packageName ?? packageName ?? '';
  const isLatestVersion = version === 'latest' || version === versions.LATEST_VERSION;

  if (!exampleName || !isLatestVersion) {
    return <InstallSection {...props} packageName={resolvedPackageName} />;
  }

  return (
    <Tabs>
      <Tab label="Install library">
        <InstallSection {...props} packageName={resolvedPackageName} />
      </Tab>
      <Tab label="Start with an example">
        <P className="mb-4">
          The{' '}
          <A href={`https://github.com/expo/examples/tree/master/${exampleName}`}>
            <CODE>{exampleName}</CODE>
          </A>{' '}
          example comes with <CODE>{resolvedPackageName}</CODE> already installed and configured:
        </P>
        <Terminal
          cmd={{
            npm: [`$ npx create-expo-app --example ${exampleName}`],
            yarn: [`$ yarn create expo-app --example ${exampleName}`],
            pnpm: [`$ pnpm create expo-app --example ${exampleName}`],
            bun: [`$ bun create expo --example ${exampleName}`],
          }}
        />
      </Tab>
    </Tabs>
  );
};
