import { Button } from '@expo/styleguide';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { NpmIcon } from '@expo/styleguide-icons/custom/NpmIcon';
import { Edit05Icon } from '@expo/styleguide-icons/outline/Edit05Icon';
import { GitCommitIcon } from '@expo/styleguide-icons/outline/GitCommitIcon';
import { useRouter } from 'next/compat/router';
import { useIntl } from 'react-intl';

import { githubUrl } from '~/ui/components/Footer/utils';
import { FOOTNOTE } from '~/ui/components/Text';

import { SdkPackageButton } from './SdkPackageButton';

type Props = {
  packageName?: string;
  sourceCodeUrl?: string;
};

function EditPageButton() {
  const router = useRouter();
  const intl = useIntl();

  if (!router?.pathname) {
    return null;
  }

  return (
    <Button
      theme="quaternary"
      size="2xs"
      className="h-auto shrink-0 border-0 px-3 py-1"
      openInNewTab
      href={githubUrl(router.pathname)}
      aria-label="Edit content of this page on GitHub">
      <div className="flex flex-row items-center gap-1">
        <Edit05Icon aria-hidden="true" className="icon-2xs text-icon-default" />
        <FOOTNOTE crawlable={false} theme="secondary" weight="medium" className="leading-[1.6]">
          {intl.formatMessage({ id: 'editPage' })}
        </FOOTNOTE>
      </div>
    </Button>
  );
}

export function PageTitleButtons({ packageName, sourceCodeUrl }: Props) {
  return (
    <>
      {!sourceCodeUrl && !packageName && <EditPageButton />}
      {(sourceCodeUrl ||
        sourceCodeUrl?.startsWith('https://github.com/expo/expo') ||
        packageName) && (
        <span className="flex items-center gap-3">
          {sourceCodeUrl && (
            <>
              <SdkPackageButton
                label="GitHub"
                Icon={GithubIcon}
                href={sourceCodeUrl}
                tooltip="View source code on GitHub"
              />
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
            </>
          )}
          {sourceCodeUrl?.startsWith('https://github.com/expo/expo') && (
            <SdkPackageButton
              label="changelog"
              Icon={GitCommitIcon}
              href={`${sourceCodeUrl}/CHANGELOG.md`}
              tooltip="View library changelog on GitHub"
            />
          )}
        </span>
      )}
    </>
  );
}
