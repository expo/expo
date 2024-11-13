import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';

import packageJson from '~/package.json';

export type VersionSelectorProps = {
  version?: string | undefined;
  setVersion: (version: string) => void;
  availableVersions: string[];
};

export const BETA_MAJOR_VERSION =
  'betaVersion' in packageJson && typeof packageJson.betaVersion === 'string'
    ? packageJson.betaVersion.split('.')[0]
    : undefined;

export const VersionSelector = ({
  version,
  setVersion,
  availableVersions,
}: VersionSelectorProps) => {
  return (
    <div className="relative">
      <select
        id="version-menu"
        className="m-0 mt-1 min-h-[40px] w-full cursor-pointer appearance-none rounded-md border border-default bg-default px-3 py-2 text-xs text-default shadow-xs"
        value={version}
        onChange={e => setVersion(e.target.value)}>
        {availableVersions.map(version => (
          <option key={version} value={version}>
            {version === 'unversioned'
              ? 'unversioned'
              : `SDK ${version}${version === BETA_MAJOR_VERSION ? '  (beta)' : ''}`}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="icon-sm pointer-events-none absolute right-3 top-4 text-icon-secondary" />
    </div>
  );
};
