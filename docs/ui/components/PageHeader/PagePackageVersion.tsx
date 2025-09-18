import { PackageIcon } from '@expo/styleguide-icons/outline/PackageIcon';
import { useRouter } from 'next/compat/router';

import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { WithTestRequire } from '~/types/common';
import { MarkdownActionsDropdown } from '~/ui/components/MarkdownActions/MarkdownActionsDropdown';
import { hasDynamicData } from '~/ui/components/MarkdownActions/paths';
import { Tag } from '~/ui/components/Tag/Tag';

const { LATEST_VERSION } = versions;

type Props = {
  packageName: string;
  showMarkdownActions?: boolean;
} & WithTestRequire;

export function PagePackageVersion({ packageName, testRequire, showMarkdownActions }: Props) {
  const { version } = usePageApiVersion();
  const router = useRouter();
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

  return (
    <div className="flex items-center gap-2">
      {versionRange && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-secondary">
          <PackageIcon className="icon-sm text-icon-secondary" />
          Bundled version:
          <Tag name={versionRange} className="select-auto" />
        </div>
      )}
      {displayMarkdownActions && <MarkdownActionsDropdown />}
    </div>
  );
}
