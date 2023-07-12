import { css } from '@emotion/react';
import { ExpoGoLogo, shadows, theme, typography } from '@expo/styleguide';
import { breakpoints, spacing } from '@expo/styleguide-base';
import { ChevronDownIcon, Monitor01DuotoneIcon, Phone01DuotoneIcon } from '@expo/styleguide-icons';
import { useEffect, useState } from 'react';

type PopupActionProps<T extends string> = {
  items: { name: string; id: T }[];
  selected: string;
  onSelect: (value: T) => void;
};
export function RuntimePopup<T extends string>({ items, selected, onSelect }: PopupActionProps<T>) {
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
        css={selectStyle}
        className="focus-visible:-outline-offset-2 border-0 rounded-none border-l border-l-default h-10 leading-10 px-10 hocus:bg-subtle hocus:shadow-none"
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
        <div
          style={{ lineHeight: 1.3 }}
          className="absolute inset-x-2.5 inset-y-0 flex items-center justify-between gap-2 text-icon-secondary pointer-events-none select-none">
          <Icon className={ICON_CLASSES} />
          <ChevronDownIcon className="icon-xs text-icon-secondary pointer-events-none" />
        </div>
      )}
    </div>
  );
}

const ICON_CLASSES = 'icon-sm text-icon-secondary pointer-events-none inline-block';

const selectStyle = css`
  ${typography.fontSizes[14]}
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.text.default};
  line-height: 1.3;
  padding: 0 ${spacing[8]}px;
  color: ${theme.text.default};
  text-indent: 0;

  box-shadow: ${shadows.xs};
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  background-color: ${theme.background.default};
  cursor: pointer;

  :hover {
    background-color: ${theme.background.element};
  }

  :focus-visible {
    background-color: ${theme.background.element};
  }

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    padding: 0 0;
    text-indent: -9999px;
  }
`;
