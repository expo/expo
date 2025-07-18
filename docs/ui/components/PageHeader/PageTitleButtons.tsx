import { Button } from '@expo/styleguide';
import { BuildIcon } from '@expo/styleguide-icons/custom/BuildIcon';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { Edit05Icon } from '@expo/styleguide-icons/outline/Edit05Icon';
import { Tag03Icon } from '@expo/styleguide-icons/outline/Tag03Icon';
import { useRouter } from 'next/compat/router';

import { githubUrl } from '~/ui/components/Footer/utils';
import { FOOTNOTE, MONOSPACE } from '~/ui/components/Text';

import { SdkPackageButton } from './SdkPackageButton';

type Props = {
  packageName?: string;
  sourceCodeUrl?: string;
};

export function PageTitleButtons({ packageName, sourceCodeUrl }: Props) {
  const router = useRouter();
  return (
    <>
      {!sourceCodeUrl && !packageName && router?.pathname && (
        <Button
          theme="quaternary"
          className="justify-center pl-2.5 pr-2"
          openInNewTab
          href={githubUrl(router.pathname)}
          aria-label="Edit content of this page on GitHub">
          <div className="flex flex-row items-center gap-2">
            <Edit05Icon className="icon-sm text-icon-secondary" />
            <FOOTNOTE crawlable={false} theme="secondary">
              Edit this page
            </FOOTNOTE>
          </div>
        </Button>
      )}
      {[
        ...(sourceCodeUrl
          ? [
              {
                icon: <GithubIcon className="mt-0.5 text-icon-secondary" />,
                label: 'GitHub',
                tooltip: (
                  <>
                    View source code of <MONOSPACE>{packageName}</MONOSPACE> on GitHub
                  </>
                ),
                href: sourceCodeUrl,
              },
            ]
          : []),
        ...(sourceCodeUrl?.startsWith('https://github.com/expo/expo')
          ? [
              {
                icon: <Tag03Icon className="mt-0.5 text-icon-secondary" />,
                label: 'Changelog',
                tooltip: (
                  <>
                    View the changelog of <MONOSPACE>{packageName}</MONOSPACE> on GitHub
                  </>
                ),
                href: `${sourceCodeUrl}/CHANGELOG.md`,
              },
            ]
          : []),
        ...(packageName
          ? [
              {
                icon: <BuildIcon className="mt-0.5 text-icon-secondary" />,
                label: 'npm',
                tooltip: 'View package in npm registry',
                href: `https://www.npmjs.com/package/${packageName}`,
              },
            ]
          : []),
      ].map(props => (
        <SdkPackageButton key={props.label} {...props} />
      ))}
    </>
  );
}
