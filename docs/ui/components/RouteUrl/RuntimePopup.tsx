import { ExpoGoLogo, mergeClasses } from '@expo/styleguide';
import { Monitor01DuotoneIcon } from '@expo/styleguide-icons/duotone/Monitor01DuotoneIcon';
import { Phone01DuotoneIcon } from '@expo/styleguide-icons/duotone/Phone01DuotoneIcon';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import { useEffect, useState } from 'react';

type RuntimePopupProps<T extends string> = {
  items: { name: string; id: T }[];
  selected: string;
  onSelect: (value: T) => void;
};

export function RuntimePopup<T extends string>({
  items,
  selected,
  onSelect,
}: RuntimePopupProps<T>) {
  const Icon = [ExpoGoLogo, Phone01DuotoneIcon, Monitor01DuotoneIcon][
    items.findIndex(item => item.id === selected)
  ];
  const [isLoaded, setLoaded] = useState(false);

  useEffect(function didMount() {
    setLoaded(true);
  }, []);

  return (
    <div className="relative">
      <select
        aria-label="Runtime URL format selector"
        title="Select runtime URL format"
        className={mergeClasses(
          'm-0 flex h-10 min-w-[100px] appearance-none items-center justify-center rounded-none border-l border-l-default bg-default px-10 indent-0 text-sm text-default shadow-xs',
          'hocus:bg-subtle hocus:shadow-none',
          'focus-visible:-outline-offset-2',
          'max-md-gutters:min-w-[unset] max-md-gutters:max-w-[60px] max-md-gutters:px-6 max-md-gutters:indent-[-9999px]'
        )}
        value={selected}
        onChange={e => {
          onSelect(e.target.value as T);
        }}>
        {items.map((item, index) => (
          <option key={String(index)} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      {isLoaded && (
        <div className="pointer-events-none absolute inset-x-3 inset-y-0 flex select-none items-center justify-between gap-2 text-icon-secondary">
          <Icon className={ICON_CLASSES} />
          <ChevronDownIcon className="icon-xs pointer-events-none text-icon-secondary" />
        </div>
      )}
    </div>
  );
}

const ICON_CLASSES = 'icon-sm text-icon-secondary pointer-events-none inline-block';
