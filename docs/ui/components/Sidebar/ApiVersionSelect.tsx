import { mergeClasses } from '@expo/styleguide';
import { ChevronDownIcon } from '@expo/styleguide-icons';

import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { A, FOOTNOTE, CALLOUT } from '~/ui/components/Text';

const { VERSIONS, LATEST_VERSION, BETA_VERSION } = versions;

export function ApiVersionSelect() {
  const { version, hasVersion, setVersion } = usePageApiVersion();

  if (!hasVersion) {
    return null;
  }

  return (
    <div
      className={mergeClasses(
        'px-4 pt-3 pb-4 flex flex-col gap-1 border-b border-b-default bg-default',
        'max-lg-gutters:sticky max-lg-gutters:top-0 max-lg-gutters:z-10'
      )}>
      <FOOTNOTE theme="tertiary">Reference version</FOOTNOTE>
      <div className="relative bg-default border border-default rounded-md shadow-xs py-2 px-3">
        <label className="flex flex-row items-center justify-between" htmlFor="api-version-select">
          <CALLOUT className="flex">{versionToText(version)}</CALLOUT>
          <ChevronDownIcon className="icon-sm shrink-0" />
        </label>
        <select
          id="api-version-select"
          className="absolute opacity-0 inset-0 size-full text-xs cursor-pointer"
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
          <A className="hidden" key={version} href={`/versions/${version}`} />
        ))}
      </div>
    </div>
  );
}

function versionToText(version: string): string {
  if (version === 'unversioned') {
    return 'Unversioned';
  } else if (version === 'latest') {
    return `${formatSdkVersion(LATEST_VERSION)} (latest)`;
  } else if (BETA_VERSION && version === BETA_VERSION.toString()) {
    return `${formatSdkVersion(BETA_VERSION.toString())} (beta)`;
  }

  return formatSdkVersion(version);
}

function formatSdkVersion(version: string): string {
  return `SDK ${version.substring(1, 3)}`;
}
