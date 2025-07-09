import { iconSize, ThemeAutoIcon, ThemeDarkIcon, ThemeLightIcon } from '@expo/styleguide-native';
import { Divider, Text, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import { Appearance } from 'react-native';

import { RadioListItem } from './RadioListItem';
import { SectionHeader } from '../../components/SectionHeader';
import { useDispatch, useSelector } from '../../redux/Hooks';
import SettingsActions from '../../redux/SettingsActions';

type ColorSchemeName = Appearance.AppearancePreferences['colorScheme'];

export function ThemeSection() {
  const dispatch = useDispatch();
  const preferredAppearance = useSelector((data) => data.settings.preferredAppearance);

  const onSelectAppearance = React.useCallback(
    (preferredAppearance: ColorSchemeName) => {
      dispatch(SettingsActions.setPreferredAppearance(preferredAppearance));
    },
    [dispatch]
  );

  const theme = useExpoTheme();

  return (
    <View>
      <SectionHeader header="Theme" />
      <View bg="default" overflow="hidden" rounded="large" border="default">
        <RadioListItem
          icon={<ThemeAutoIcon color={theme.icon.default} size={iconSize.regular} />}
          title="Automatic"
          checked={preferredAppearance === undefined}
          onPress={() => onSelectAppearance(undefined)}
        />
        <Divider style={{ height: 1 }} />
        <RadioListItem
          icon={<ThemeLightIcon color={theme.icon.default} size={iconSize.regular} />}
          title="Light"
          checked={preferredAppearance === 'light'}
          onPress={() => onSelectAppearance('light')}
        />
        <Divider style={{ height: 1 }} />
        <RadioListItem
          icon={<ThemeDarkIcon color={theme.icon.default} size={iconSize.regular} />}
          title="Dark"
          checked={preferredAppearance === 'dark'}
          onPress={() => onSelectAppearance('dark')}
        />
      </View>
      <View py="small" px="medium">
        <Text size="small" color="secondary" type="InterRegular">
          Automatic is only supported on operating systems that allow you to control the system-wide
          color scheme.
        </Text>
      </View>
    </View>
  );
}
