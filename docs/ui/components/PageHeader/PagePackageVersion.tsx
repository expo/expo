import { mergeClasses } from '@expo/styleguide';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { PackageIcon } from '@expo/styleguide-icons/outline/PackageIcon';
import { useState } from 'react';

import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { WithTestRequire } from '~/types/common';
import { FOOTNOTE } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

const { LATEST_VERSION } = versions;

type Props = {
  packageName: string;
  platforms?: string[];
  className?: string;
} & WithTestRequire;

export function PagePackageVersion({ packageName, platforms, testRequire, className }: Props) {
  const { version } = usePageApiVersion();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
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

  if (!versionRange) {
    return null;
  }

  const isIncludedInExpoGo =
    platforms?.some(platform => platform.toLowerCase().includes('expo-go')) ?? false;
  const recommendedVersionDescription =
    "The version of this library that's compatible with the Expo SDK version you're viewing." +
    (isIncludedInExpoGo ? " It's also the library version included in Expo Go." : '');

  return (
    <div
      data-md="package-version"
      data-md-version={versionRange}
      className={mergeClasses(
        'flex items-center gap-1 text-xs leading-[1.6] text-secondary',
        className
      )}>
      <PackageIcon aria-hidden="true" className="icon-xs text-icon-default" />
      <span className="select-auto">Recommended: {versionRange}</span>
      <Tooltip.Root open={isTooltipOpen} onOpenChange={setIsTooltipOpen} delayDuration={100}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label="More information about recommended version"
            onClick={() => {
              setIsTooltipOpen(!isTooltipOpen);
            }}
            className="inline-flex items-center justify-center rounded-full text-icon-secondary hover:text-icon-default focus:ring-2 focus:ring-link focus:ring-offset-1 focus:outline-none active:text-icon-default">
            <ChevronDownIcon aria-hidden="true" className="icon-xs" />
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
  );
}
