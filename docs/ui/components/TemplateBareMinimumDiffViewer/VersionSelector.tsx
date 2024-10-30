import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';

import packageJson from '~/package.json';

const BETA_MAJOR_VERSION = packageJson.betaVersion.split('.')[0];

export type VersionSelectorProps = {
  version?: string | undefined;
  setVersion: (version: string) => void;
  availableVersions: string[];
};

export const VersionSelector = ({
  version,
  setVersion,
  availableVersions,
}: VersionSelectorProps) => {
  return (
    <div className="relative">
      <select
        id="version-menu"
        className="text-xs text-default m-0 mt-1 px-3 py-2 min-h-[40px] w-full border border-default shadow-xs rounded-md cursor-pointer appearance-none bg-default"
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
      <ChevronDownIcon className="icon-sm text-icon-secondary absolute right-3 top-4 pointer-events-none" />
    </div>
  );
};
