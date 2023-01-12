import { css } from '@emotion/react';
import {
  theme,
  typography,
  spacing,
  iconSize,
  shadows,
  ChevronDownIcon,
  borderRadius,
} from '@expo/styleguide';

import { A } from '../Text';

import * as Utilities from '~/common/utilities';
import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';

const { VERSIONS, LATEST_VERSION, BETA_VERSION } = versions;

const STYLES_CONTAINER = css({
  position: 'relative',
});

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

const STYLES_ICON = css({
  position: 'absolute',
  right: 12,
  top: 16,
  pointerEvents: 'none',
});

export const VersionSelector = () => {
  const { version, hasVersion, setVersion } = usePageApiVersion();

  if (!hasVersion) {
    return null;
  }

  return (
    <div css={STYLES_CONTAINER}>
      {
        // Add hidden links to create crawlable references to other SDK versions
        // We can use JS to switch between them, while helping search bots find other SDK versions
        VERSIONS.map(version => (
          <A key={version} style={{ display: 'none' }} href={`/versions/${version}/`} />
        ))
      }
      <select
        id="version-menu"
        css={[STYLES_SELECT]}
        value={version}
        onChange={e => setVersion(e.target.value)}>
        {VERSIONS.map(version => (
          <option key={version} value={version}>
            {Utilities.getUserFacingVersionString(
              version,
              LATEST_VERSION,
              typeof BETA_VERSION === 'boolean' ? undefined : BETA_VERSION
            )}
          </option>
        ))}
      </select>
      <ChevronDownIcon size={iconSize.sm} css={STYLES_ICON} />
    </div>
  );
};
