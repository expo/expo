import { Themes, useTheme } from '@expo/styleguide';
import { Contrast02SolidIcon } from '@expo/styleguide-icons/solid/Contrast02SolidIcon';
import { Moon01SolidIcon } from '@expo/styleguide-icons/solid/Moon01SolidIcon';
import { SunSolidIcon } from '@expo/styleguide-icons/solid/SunSolidIcon';
import { useEffect, useState } from 'react';

import { Select } from '~/ui/components/Select';

const options = [
  {
    id: Themes.AUTO,
    label: 'Auto',
    Icon: Contrast02SolidIcon,
  },
  {
    id: Themes.LIGHT,
    label: 'Light',
    Icon: SunSolidIcon,
  },
  {
    id: Themes.DARK,
    label: 'Dark',
    Icon: Moon01SolidIcon,
  },
];

export function ThemeSelector() {
  const { themeName, setAutoMode, setDarkMode, setLightMode } = useTheme();

  const [loaded, setLoaded] = useState(false);

  useEffect(function didMount() {
    setLoaded(true);
  }, []);

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
      value={loaded ? (themeName ?? Themes.AUTO) : undefined}
      onValueChange={onThemeSelect}
      options={options}
      optionsLabel="Theme"
      ariaLabel="Theme selector"
    />
  );
}
