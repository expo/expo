import { Themes, useTheme } from '@expo/styleguide';
import { Contrast02SolidIcon } from '@expo/styleguide-icons/solid/Contrast02SolidIcon';
import { Moon01SolidIcon } from '@expo/styleguide-icons/solid/Moon01SolidIcon';
import { SunSolidIcon } from '@expo/styleguide-icons/solid/SunSolidIcon';
import { useIntl } from 'react-intl';

import { Select } from '~/ui/components/Select';

export function ThemeSelector() {
  const intl = useIntl();
  const { themeName, setAutoMode, setDarkMode, setLightMode } = useTheme();
  const options = [
    {
      id: Themes.AUTO,
      label: intl.formatMessage({ id: 'themeAuto' }),
      Icon: Contrast02SolidIcon,
    },
    {
      id: Themes.LIGHT,
      label: intl.formatMessage({ id: 'themeLight' }),
      Icon: SunSolidIcon,
    },
    {
      id: Themes.DARK,
      label: intl.formatMessage({ id: 'themeDark' }),
      Icon: Moon01SolidIcon,
    },
  ];

  function onThemeSelect(value: string) {
    if (value === Themes.AUTO) {
      setAutoMode();
    }
    if (value === Themes.DARK) {
      setDarkMode();
    }
    if (value === Themes.LIGHT) {
      setLightMode();
    }
  }

  return (
    <Select
      className="min-w-[108px]"
      value={themeName ?? Themes.AUTO}
      onValueChange={onThemeSelect}
      options={options}
      optionsLabel="Theme"
      ariaLabel="Theme selector"
    />
  );
}
