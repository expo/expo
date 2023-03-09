import { css } from '@emotion/react';
import { shadows, theme } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { ChevronDownIcon } from '@expo/styleguide-icons';

import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { A, LABEL } from '~/ui/components/Text';

const { VERSIONS, LATEST_VERSION, BETA_VERSION } = versions;

// TODO(cedric): move this to a generic select input, so we can reuse it in the color scheme selector

export function ApiVersionSelect() {
  const { version, hasVersion, setVersion } = usePageApiVersion();

  if (!hasVersion) {
    return null;
  }

  return (
    <div css={containerStyle}>
      <label css={labelStyle} htmlFor="api-version-select">
        <LABEL css={labelTextStyle}>{versionToText(version)}</LABEL>
        <ChevronDownIcon className="icon-sm shrink-0" />
      </label>
      <select
        id="api-version-select"
        css={selectStyle}
        value={version}
        onChange={event => setVersion(event.target.value)}>
        {VERSIONS.map(version => (
          <option key={version} value={version}>
            {versionToText(version)}
          </option>
        ))}
      </select>
      {/* Changing versions is a JS only mechanism. To help crawlers find other versions, we add hidden links. */}
      {VERSIONS.map(version => (
        <A css={crawlerLinkStyle} key={version} href={`/versions/${version}`} />
      ))}
    </div>
  );
}

function versionToText(version: string): string {
  if (version === 'unversioned') {
    return 'Unversioned';
  } else if (version === 'latest') {
    return `${versionToText(LATEST_VERSION)} (latest)`;
  } else if (BETA_VERSION && version === BETA_VERSION.toString()) {
    return `${versionToText(BETA_VERSION.toString())} (beta)`;
  }
  return `SDK ${version.substring(1, 3)}`;
}

const containerStyle = css({
  position: 'relative',
  background: theme.background.default,
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.md,
  boxShadow: shadows.xs,
  margin: spacing[4],
  padding: `${spacing[2]}px ${spacing[3]}px`,
});

const labelStyle = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

const labelTextStyle = css({
  flex: 1,
});

const crawlerLinkStyle = css({
  display: 'none',
});

const selectStyle = css({
  borderRadius: 0,
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0,
  cursor: 'pointer',
});
