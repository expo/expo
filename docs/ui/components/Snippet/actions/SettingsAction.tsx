import { Themes } from '@expo/styleguide';
import { DotsVerticalIcon } from '@expo/styleguide-icons/outline/DotsVerticalIcon';

import { Checkbox } from '../../Form/Checkbox';
import { SnippetAction, SnippetActionProps } from '../SnippetAction';

import { useCodeBlockSettingsContext } from '~/providers/CodeBlockSettingsProvider';
import * as Dropdown from '~/ui/components/Dropdown';

export const SettingsAction = ({ ...rest }: SnippetActionProps) => {
  const { preferredTheme, setPreferredTheme, wordWrap, setWordWrap } =
    useCodeBlockSettingsContext();

  const onThemeChange = () => {
    if (preferredTheme === Themes.AUTO) {
      setPreferredTheme(Themes.DARK);
    } else if (preferredTheme === Themes.DARK) {
      setPreferredTheme(Themes.AUTO);
    }
  };

  const onWordWrapChange = () => {
    setWordWrap(!wordWrap);
  };

  return (
    <Dropdown.Dropdown
      trigger={
        <div className="flex h-full">
          <SnippetAction
            className="px-3 min-w-[44px]"
            leftSlot={<DotsVerticalIcon className="shrink-0 icon-md text-icon-secondary" />}
            {...rest}
          />
        </div>
      }>
      <Dropdown.Item
        preventAutoClose
        label="Use dark theme"
        onSelect={onThemeChange}
        rightSlot={
          <Checkbox
            checked={preferredTheme === Themes.DARK}
            readOnly
            className="pointer-events-none"
          />
        }
      />
      <Dropdown.Item
        preventAutoClose
        label="Wrap long lines"
        onSelect={onWordWrapChange}
        rightSlot={<Checkbox checked={wordWrap} readOnly className="pointer-events-none" />}
      />
    </Dropdown.Dropdown>
  );
};
