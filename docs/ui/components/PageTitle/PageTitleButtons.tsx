import { Button, mergeClasses } from '@expo/styleguide';
import { BuildIcon } from '@expo/styleguide-icons/custom/BuildIcon';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { Edit05Icon } from '@expo/styleguide-icons/outline/Edit05Icon';
import { useRouter } from 'next/compat/router';

import { githubUrl } from '~/ui/components/Footer/utils';
import { CALLOUT } from '~/ui/components/Text';

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
          className="justify-center px-2"
          openInNewTab
          href={githubUrl(router.pathname)}
          title="Edit content of this page on GitHub">
          <div className="flex flex-row items-center gap-2">
            <Edit05Icon className="icon-sm text-icon-secondary" />
            <CALLOUT crawlable={false} theme="secondary">
              Edit this page
            </CALLOUT>
          </div>
        </Button>
      )}
      {sourceCodeUrl && (
        <Button
          theme="quaternary"
          className="min-h-[48px] min-w-[60px] justify-center px-2 max-xl-gutters:min-h-[unset]"
          openInNewTab
          href={sourceCodeUrl}
          title={`View source code of ${packageName} on GitHub`}>
          <div
            className={mergeClasses(
              'flex flex-col items-center',
              'max-xl-gutters:flex-row max-xl-gutters:gap-1.5'
            )}>
            <GithubIcon className="mt-0.5 text-icon-secondary" />
            <CALLOUT crawlable={false} theme="secondary">
              GitHub
            </CALLOUT>
          </div>
        </Button>
      )}
      {packageName && (
        <Button
          theme="quaternary"
          openInNewTab
          className="min-h-[48px] min-w-[60px] justify-center px-2 max-xl-gutters:min-h-[unset]"
          href={`https://www.npmjs.com/package/${packageName}`}
          title="View package in npm Registry">
          <div
            className={mergeClasses(
              'flex flex-col items-center',
              'max-xl-gutters:flex-row max-xl-gutters:gap-1.5'
            )}>
            <BuildIcon className="mt-0.5 text-icon-secondary" />
            <CALLOUT crawlable={false} theme="secondary">
              npm
            </CALLOUT>
          </div>
        </Button>
      )}
    </>
  );
}
