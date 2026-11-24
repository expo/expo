import { mergeClasses, Themes, useTheme } from '@expo/styleguide';
import { Laptop02Icon } from '@expo/styleguide-icons/outline/Laptop02Icon';
import { Moon01Icon } from '@expo/styleguide-icons/outline/Moon01Icon';
import { SunIcon } from '@expo/styleguide-icons/outline/SunIcon';
import { useRef, type KeyboardEvent } from 'react';
import { useIntl } from 'react-intl';

const ARROW_KEY_STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

type ThemeSelectorProps = {
  ariaLabel?: string;
  inactiveIconClassName?: string;
};

export function ThemeSelector({
  ariaLabel = 'Theme selector',
  inactiveIconClassName = 'text-[#80838d] dark:text-icon-secondary',
}: ThemeSelectorProps) {
  const intl = useIntl();
  const { themeName, setAutoMode, setDarkMode, setLightMode } = useTheme();
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const options = [
    {
      id: Themes.AUTO,
      label: intl.formatMessage({ id: 'themeAuto' }),
      Icon: Laptop02Icon,
      select: setAutoMode,
    },
    {
      id: Themes.LIGHT,
      label: intl.formatMessage({ id: 'themeLight' }),
      Icon: SunIcon,
      select: setLightMode,
    },
    {
      id: Themes.DARK,
      label: intl.formatMessage({ id: 'themeDark' }),
      Icon: Moon01Icon,
      select: setDarkMode,
    },
  ];
  const activeIndex = Math.max(
    options.findIndex(option => option.id === (themeName ?? Themes.AUTO)),
    0
  );

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = ARROW_KEY_STEPS[event.key];
    if (!step) {
      return;
    }
    event.preventDefault();
    const nextIndex = (activeIndex + step + options.length) % options.length;
    options[nextIndex].select();
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className="inline-flex gap-1 rounded-[38px] p-1 outline-(--expo-theme-border-default) outline-[0.5px] outline-offset-[-0.5px]">
      {options.map(({ id, label, Icon, select }, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={id}
            ref={element => {
              optionRefs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            tabIndex={isActive ? 0 : -1}
            onClick={select}
            className={mergeClasses(
              'flex rounded-[40px] p-1.5 hocus:bg-element',
              isActive && 'bg-element'
            )}>
            <Icon
              aria-hidden="true"
              className={mergeClasses(
                'icon-xs',
                isActive ? 'text-icon-default' : inactiveIconClassName
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
