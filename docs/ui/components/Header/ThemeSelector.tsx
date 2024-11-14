import { useTheme, mergeClasses } from '@expo/styleguide';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { Contrast02SolidIcon } from '@expo/styleguide-icons/solid/Contrast02SolidIcon';
import { Moon01SolidIcon } from '@expo/styleguide-icons/solid/Moon01SolidIcon';
import { SunSolidIcon } from '@expo/styleguide-icons/solid/SunSolidIcon';
import { useEffect, useState } from 'react';

export const ThemeSelector = () => {
  const { themeName, setAutoMode, setDarkMode, setLightMode } = useTheme();
  const [isLoaded, setLoaded] = useState(false);

  useEffect(function didMount() {
    setLoaded(true);
  }, []);

  return (
    <div className="relative">
      <select
        aria-label="Theme selector"
        title="Select theme"
        className={mergeClasses(
          'm-0 flex h-9 w-[50px] appearance-none items-center justify-center rounded-md border border-default bg-default p-0 indent-[-9999px] text-sm leading-[1.3] text-default shadow-xs',
          'hocus:bg-element',
          'max-lg-gutters:w-auto max-lg-gutters:min-w-[100px] max-lg-gutters:px-2 max-lg-gutters:pl-8 max-lg-gutters:indent-0 max-lg-gutters:text-secondary'
        )}
        value={themeName}
        onChange={e => {
          const option = e.target.value;
          if (option === 'auto') setAutoMode();
          if (option === 'dark') setDarkMode();
          if (option === 'light') setLightMode();
        }}>
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      {isLoaded && (
        <>
          {themeName === 'auto' && <Contrast02SolidIcon className={ICON_CLASSES} />}
          {themeName === 'dark' && <Moon01SolidIcon className={ICON_CLASSES} />}
          {themeName === 'light' && <SunSolidIcon className={ICON_CLASSES} />}
        </>
      )}
      <ChevronDownIcon className="icon-xs pointer-events-none absolute right-2 top-3 text-icon-secondary" />
    </div>
  );
};

const ICON_CLASSES = 'icon-sm absolute left-2.5 top-2.5 text-icon-secondary pointer-events-none';
