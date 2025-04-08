import { PackageIcon } from '@expo/styleguide-icons/outline/PackageIcon';

import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { WithTestRequire } from '~/types/common';
import { Tag } from '~/ui/components/Tag/Tag';

const { LATEST_VERSION } = versions;

type Props = {
  packageName: string;
} & WithTestRequire;

export function PagePackageVersion({ packageName, testRequire }: Props) {
  const { version } = usePageApiVersion();
  const { versions } = testRequire
    ? testRequire(
        `~/public/static/schemas/${version === 'latest' ? LATEST_VERSION : version}/native-modules.json`
      )
    : require(
        `~/public/static/schemas/${version === 'latest' ? LATEST_VERSION : version}/native-modules.json`
      );

  try {
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-secondary">
        <PackageIcon className="icon-sm text-icon-secondary" />
        Bundled version:
        <Tag
          name={
            versions.find((entry: Record<string, string>) => entry.npmPackage === packageName)
              .versionRange
          }
          className="select-auto"
        />
      </div>
    );
  } catch {
    return null;
  }
}
