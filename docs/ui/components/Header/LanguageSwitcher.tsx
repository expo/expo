import { mergeClasses } from '@expo/styleguide';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import {
  buildLocalePath,
  getLocaleFromPath,
  isTranslatableSection,
  type SupportedLocale,
} from '~/common/i18n';
import { Select } from '~/ui/components/Select';

const options = [
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' },
];

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const router = useRouter();
  const intl = useIntl();
  const currentLocale = getLocaleFromPath(router.asPath);

  if (!isTranslatableSection(router.asPath)) {
    return null;
  }

  function onLocaleSelect(value: string) {
    const targetLocale = value as SupportedLocale;
    if (targetLocale === currentLocale) {
      return;
    }
    void router.push(buildLocalePath(router.asPath, targetLocale));
  }

  return (
    <Select
      className={mergeClasses('min-w-25 whitespace-nowrap', className)}
      value={currentLocale}
      onValueChange={onLocaleSelect}
      options={options}
      optionsLabel={intl.formatMessage({ id: 'languageSwitcher.label' })}
      ariaLabel={intl.formatMessage({ id: 'languageSwitcher.label' })}
    />
  );
}
