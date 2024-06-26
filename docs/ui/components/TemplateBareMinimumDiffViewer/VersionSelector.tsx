import { css } from '@emotion/react';
import { theme, typography, shadows } from '@expo/styleguide';
import { spacing, borderRadius } from '@expo/styleguide-base';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';

const STYLES_SELECT = css({
  ...typography.fontSizes[14],
  color: theme.text.default,
  margin: 0,
  marginTop: spacing[1],
  padding: `${spacing[2]}px ${spacing[3]}px`,
  minHeight: 40,
  borderRadius: borderRadius.md,
  marginBottom: spacing[4],
  width: '100%',
  backgroundColor: theme.background.default,
  border: `1px solid ${theme.border.default}`,
  boxShadow: shadows.xs,
  appearance: 'none',
  outline: 'none',
  cursor: 'pointer',
});

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
        css={STYLES_SELECT}
        value={version}
        onChange={e => setVersion(e.target.value)}>
        {availableVersions.map(version => (
          <option key={version} value={version}>
            {version === 'unversioned' ? 'unversioned' : `SDK ${version}`}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="icon-sm text-icon-secondary absolute right-3 top-4 pointer-events-none" />
    </div>
  );
};
