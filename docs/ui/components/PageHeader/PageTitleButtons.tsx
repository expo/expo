import { Button, mergeClasses } from '@expo/styleguide';
import { BuildIcon } from '@expo/styleguide-icons/custom/BuildIcon';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { Edit05Icon } from '@expo/styleguide-icons/outline/Edit05Icon';
import { useRouter } from 'next/compat/router';

import { githubUrl } from '~/ui/components/Footer/utils';
import { FOOTNOTE, MONOSPACE } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

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
        <Tooltip.Root delayDuration={500}>
          <Tooltip.Trigger asChild>
            <Button
              theme="quaternary"
              className="min-h-[48px] min-w-[60px] justify-center px-2 max-xl-gutters:min-h-[unset]"
              openInNewTab
              href={sourceCodeUrl}>
              <div
                className={mergeClasses(
                  'flex flex-col items-center',
                  'max-xl-gutters:flex-row max-xl-gutters:gap-1.5'
                )}>
                <GithubIcon className="mt-0.5 text-icon-secondary" />
                <FOOTNOTE crawlable={false} theme="secondary">
                  GitHub
                </FOOTNOTE>
              </div>
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content className="max-w-[300px]">
            <FOOTNOTE>
              View source code of <MONOSPACE>{packageName}</MONOSPACE> on GitHub
            </FOOTNOTE>
          </Tooltip.Content>
        </Tooltip.Root>
      )}
      {packageName && (
        <Tooltip.Root delayDuration={500}>
          <Tooltip.Trigger asChild>
            <Button
              theme="quaternary"
              openInNewTab
              className="min-h-[48px] min-w-[60px] justify-center px-2 max-xl-gutters:min-h-[unset]"
              href={`https://www.npmjs.com/package/${packageName}`}>
              <div
                className={mergeClasses(
                  'flex flex-col items-center',
                  'max-xl-gutters:flex-row max-xl-gutters:gap-1.5'
                )}>
                <BuildIcon className="mt-0.5 text-icon-secondary" />
                <FOOTNOTE crawlable={false} theme="secondary">
                  npm
                </FOOTNOTE>
              </div>
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <FOOTNOTE>View package in npm registry</FOOTNOTE>
          </Tooltip.Content>
        </Tooltip.Root>
      )}
    </>
  );
}
