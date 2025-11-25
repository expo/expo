import { Button } from '@expo/styleguide';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { NpmIcon } from '@expo/styleguide-icons/custom/NpmIcon';
import { ClockRefreshIcon } from '@expo/styleguide-icons/outline/ClockRefreshIcon';
import { Edit05Icon } from '@expo/styleguide-icons/outline/Edit05Icon';
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
  const showEditButton = !sourceCodeUrl && !packageName && router?.pathname;

  return (
    <>
      {showEditButton && (
        <Button
          theme="quaternary"
          className="justify-center pl-2.5 pr-2"
          openInNewTab
          href={githubUrl(router.pathname)}
          aria-label="Edit content of this page on GitHub">
          <div className="flex flex-row items-center gap-2">
            <Edit05Icon className="icon-sm text-icon-secondary" />
            <FOOTNOTE crawlable={false} theme="secondary">
              Edit page
            </FOOTNOTE>
          </div>
        </Button>
      )}
      {(sourceCodeUrl ||
        sourceCodeUrl?.startsWith('https://github.com/expo/expo') ||
        packageName) && (
        <span className="flex items-center">
          {sourceCodeUrl && (
            <>
              <SdkPackageButton
                label="GitHub"
                Icon={GithubIcon}
                href={sourceCodeUrl}
                tooltip="View source code on GitHub"
              />
              {(packageName || sourceCodeUrl?.startsWith('https://github.com/expo/expo')) && (
                <div className="max-sm:hidden bg-secondary mx-2 h-5 w-px" />
              )}
            </>
          )}
          {packageName && (
            <>
              <SdkPackageButton
                label="npm"
                Icon={NpmIcon}
                href={`https://www.npmjs.com/package/${packageName}`}
                tooltip="View library in npm registry"
              />
              {sourceCodeUrl?.startsWith('https://github.com/expo/expo') && (
                <div className="max-sm:hidden bg-secondary mx-2 h-5 w-px" />
              )}
            </>
          )}
          {sourceCodeUrl?.startsWith('https://github.com/expo/expo') && (
            <SdkPackageButton
              label="Changelog"
              Icon={ClockRefreshIcon}
              href={`${sourceCodeUrl}/CHANGELOG.md`}
              tooltip="View library changelog on GitHub"
            />
          )}
        </span>
      )}
    </>
  );
}
