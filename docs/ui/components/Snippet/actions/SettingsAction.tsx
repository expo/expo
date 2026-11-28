import { Themes } from '@expo/styleguide';
import { DotsVerticalIcon } from '@expo/styleguide-icons/outline/DotsVerticalIcon';
import { useIntl } from 'react-intl';

import { useCodeBlockSettingsContext } from '~/providers/CodeBlockSettingsProvider';
import * as Dropdown from '~/ui/components/Dropdown';

import { Checkbox } from '../../Form/Checkbox';
import { SnippetAction, SnippetActionProps } from '../SnippetAction';

export const SettingsAction = ({ ...rest }: SnippetActionProps) => {
  const intl = useIntl();
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
      sideOffset={6}
      trigger={
        <SnippetAction
          className="w-8 justify-center px-0"
          aria-label="Show settings"
          leftSlot={
            <DotsVerticalIcon
              aria-hidden="true"
              className="icon-xs shrink-0 text-button-quaternary-icon"
            />
          }
          {...rest}
        />
      }>
      <Dropdown.Item
        preventAutoClose
        label={intl.formatMessage({ id: 'codeUseDarkTheme' })}
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
        label={intl.formatMessage({ id: 'codeWrapLines' })}
        onSelect={onWordWrapChange}
        rightSlot={<Checkbox checked={wordWrap} readOnly className="pointer-events-none" />}
      />
    </Dropdown.Dropdown>
  );
};
