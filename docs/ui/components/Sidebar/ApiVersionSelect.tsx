import { mergeClasses } from '@expo/styleguide';
import { Beaker02Icon } from '@expo/styleguide-icons/outline/Beaker02Icon';

import { versionToText } from '~/common/utilities';
import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { Select } from '~/ui/components/Select';
import { A, FOOTNOTE } from '~/ui/components/Text';

const { VERSIONS } = versions;

export function ApiVersionSelect() {
  const { version, hasVersion, setVersion } = usePageApiVersion();

  if (!hasVersion) {
    return null;
  }

  return (
    <div
      className={mergeClasses(
        'flex flex-col gap-1 border-b border-b-default bg-default px-4 pb-4 pt-3',
        'max-lg-gutters:sticky max-lg-gutters:top-0 max-lg-gutters:z-10'
      )}>
      <FOOTNOTE theme="tertiary">Reference version</FOOTNOTE>
      <Select
        id="api-version-select"
        className="min-w-full"
        value={version}
        onValueChange={setVersion}
        options={VERSIONS.map(version => ({
          id: version,
          label: versionToText(version),
          Icon: version === 'unversioned' ? Beaker02Icon : undefined,
        }))}
        optionsLabel="Reference version"
        ariaLabel="Reference version selector"
      />
      {/* Changing versions is a JS only mechanism. To help crawlers find other versions, we add hidden links. */}
      {VERSIONS.map(version => (
        <A className="hidden" key={version} href={`/versions/${version}`} />
      ))}
    </div>
  );
}
