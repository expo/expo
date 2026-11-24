import { mergeClasses } from '@expo/styleguide';
import { Beaker02Icon } from '@expo/styleguide-icons/outline/Beaker02Icon';

import { versionToText } from '~/common/utilities';
import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { Select } from '~/ui/components/Select';
import { A } from '~/ui/components/Text';

const { VERSIONS, LATEST_VERSION } = versions;
const SELECTABLE_VERSIONS = VERSIONS.filter(version => version !== LATEST_VERSION);

export const SIDEBAR_SELECT_CLASS_NAME =
  'w-full min-w-full gap-2.5 rounded-3xl border-0.5 border-default bg-default py-2 pr-[15.5px] pl-[11.5px] text-sm leading-[1.4] font-medium text-secondary shadow-xs hocus:bg-element hocus:dark:bg-subtle [&_div]:leading-[1.4] [&_div]:font-medium [&_div]:text-secondary [&_span]:leading-[1.4] [&_svg]:text-icon-default';

export function ApiVersionSelect() {
  const { version, hasVersion, setVersion } = usePageApiVersion();

  if (!hasVersion) {
    return null;
  }

  return (
    <div
      className={mergeClasses(
        'lg:mt-4',
        'max-lg:sticky max-lg:top-0 max-lg:z-10 max-lg:border-b max-lg:border-b-default max-lg:bg-default max-lg:p-4'
      )}>
      <Select
        id="api-version-select"
        className={SIDEBAR_SELECT_CLASS_NAME}
        value={version === LATEST_VERSION ? 'latest' : version}
        onValueChange={setVersion}
        options={SELECTABLE_VERSIONS.map(version => ({
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
