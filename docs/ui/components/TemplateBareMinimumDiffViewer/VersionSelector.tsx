import { Beaker02Icon } from '@expo/styleguide-icons/outline/Beaker02Icon';

import { versionToText } from '~/common/utilities';
import packageJson from '~/package.json';
import { Select } from '~/ui/components/Select';

export type VersionSelectorProps = {
  version?: string;
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
    <Select
      className="min-w-full"
      value={version}
      onValueChange={setVersion}
      options={availableVersions.map(version => ({
        id: version,
        label: versionToText(version),
        Icon: version === 'unversioned' ? Beaker02Icon : undefined,
      }))}
      optionsLabel="SDK version"
      ariaLabel="SDK version selector"
    />
  );
};
