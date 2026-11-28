import { mergeClasses } from '@expo/styleguide';

import { getLanguageStatusLabel, getModulesV2Feature, LanguageStatus } from './data';

type LanguageSupportProps = {
  feature: string;
};

/**
 * Shows which languages support an Expo Modules API 2.0 feature. Place it below the heading of the
 * section that describes the feature.
 */
export function LanguageSupport({ feature }: LanguageSupportProps) {
  const { swift, kotlin } = getModulesV2Feature(feature);

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      <LanguageTag language="Kotlin" status={kotlin} />
      <LanguageTag language="Swift" status={swift} />
    </div>
  );
}

function LanguageTag({ language, status }: { language: string; status: LanguageStatus }) {
  return (
    <span
      className={mergeClasses(
        'inline-flex min-h-5.25 items-center rounded-full border border-default bg-element px-1.75 py-0.5 text-xs leading-none whitespace-nowrap',
        status !== 'supported' && 'border-dashed text-secondary'
      )}>
      {language}: {getLanguageStatusLabel(status).toLowerCase()}
    </span>
  );
}
