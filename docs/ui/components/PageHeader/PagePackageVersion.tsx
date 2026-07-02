import { mergeClasses } from '@expo/styleguide';
import { InfoCircleDuotoneIcon } from '@expo/styleguide-icons/duotone/InfoCircleDuotoneIcon';
import { PackageIcon } from '@expo/styleguide-icons/outline/PackageIcon';
import { useRouter } from 'next/compat/router';
import { useState } from 'react';

import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { WithTestRequire } from '~/types/common';
import { MarkdownActionsDropdown } from '~/ui/components/MarkdownActions/MarkdownActionsDropdown';
import { hasDynamicData } from '~/ui/components/MarkdownActions/paths';
import { Tag } from '~/ui/components/Tag/Tag';
import { FOOTNOTE } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

const { LATEST_VERSION } = versions;

type Props = {
  packageName: string;
  platforms?: string[];
  showMarkdownActions?: boolean;
  className?: string;
} & WithTestRequire;

export function PagePackageVersion({
  packageName,
  platforms,
  testRequire,
  showMarkdownActions,
  className,
}: Props) {
  const { version } = usePageApiVersion();
  const router = useRouter();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const currentPath = router?.asPath ?? router?.pathname ?? '';
  const displayMarkdownActions = showMarkdownActions && !hasDynamicData(currentPath);
  const { versions } = testRequire
    ? testRequire(
        `~/public/static/schemas/${version === 'latest' ? LATEST_VERSION : version}/native-modules.json`
      )
    : require(
        `~/public/static/schemas/${version === 'latest' ? LATEST_VERSION : version}/native-modules.json`
      );

  const versionRange = versions.find(
    (entry: Record<string, string>) => entry.npmPackage === packageName
  )?.versionRange;

  if (!versionRange && !displayMarkdownActions) {
    return null;
  }

  const isIncludedInExpoGo =
    platforms?.some(platform => platform.toLowerCase().includes('expo-go')) ?? false;
  const recommendedVersionDescription =
    "The version of this library that's compatible with the Expo SDK version you're viewing." +
    (isIncludedInExpoGo ? " It's also the library version included in Expo Go." : '');

  return (
    <div className={mergeClasses('flex items-center gap-2', className)}>
      {versionRange && (
        <div
          data-md="skip"
          className="flex items-center justify-center gap-1.5 text-sm text-secondary">
          <PackageIcon aria-hidden="true" className="icon-sm text-icon-secondary" />
          Recommended version:
          <Tag name={versionRange} className="select-auto" />
          <Tooltip.Root open={isTooltipOpen} onOpenChange={setIsTooltipOpen} delayDuration={100}>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                aria-label="More information about recommended version"
                onClick={() => {
                  setIsTooltipOpen(!isTooltipOpen);
                }}
                className="inline-flex items-center justify-center rounded-full p-1 text-icon-secondary hover:text-icon-default focus:ring-2 focus:ring-link focus:ring-offset-1 focus:outline-none active:text-icon-default">
                <InfoCircleDuotoneIcon aria-hidden="true" className="icon-xs" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content
              side="top"
              className="max-w-75"
              sideOffset={8}
              collisionPadding={{ left: 16, right: 16 }}>
              <FOOTNOTE>{recommendedVersionDescription}</FOOTNOTE>
            </Tooltip.Content>
          </Tooltip.Root>
        </div>
      )}
      {displayMarkdownActions && <MarkdownActionsDropdown />}
    </div>
  );
}
