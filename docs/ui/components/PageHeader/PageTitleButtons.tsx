import { Button } from '@expo/styleguide';
import { BuildIcon } from '@expo/styleguide-icons/custom/BuildIcon';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { Edit05Icon } from '@expo/styleguide-icons/outline/Edit05Icon';
import { Tag03Icon } from '@expo/styleguide-icons/outline/Tag03Icon';
import { useRouter } from 'next/compat/router';

import { githubUrl } from '~/ui/components/Footer/utils';
import { FOOTNOTE } from '~/ui/components/Text';

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
      {sourceCodeUrl && (
        <SdkPackageButton
          label="GitHub"
          Icon={GithubIcon}
          href={sourceCodeUrl}
          tooltip="View source code on GitHub"
        />
      )}
      {sourceCodeUrl?.startsWith('https://github.com/expo/expo') && (
        <SdkPackageButton
          label="Changelog"
          Icon={Tag03Icon}
          href={`${sourceCodeUrl}/CHANGELOG.md`}
          tooltip="View package changelog on GitHub"
        />
      )}
      {packageName && (
        <SdkPackageButton
          label="npm"
          Icon={BuildIcon}
          href={`https://www.npmjs.com/package/${packageName}`}
          tooltip="View package in npm registry"
        />
      )}
    </>
  );
}
