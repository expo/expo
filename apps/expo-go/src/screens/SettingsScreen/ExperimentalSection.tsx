import { iconSize } from '@expo/styleguide-native';
import { Divider, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';

import { CheckListItem } from './CheckListItem';
import { ShakeDeviceIcon } from './ShakeDeviceIcon';
import { SectionHeader } from '../../components/SectionHeader';
import { useDispatch, useSelector } from '../../redux/Hooks';
import SettingsActions from '../../redux/SettingsActions';

export function ExperimentalSection() {
  const dispatch = useDispatch();
  const devMenuSettings = useSelector((data) => data.settings.devMenuSettings);

  const onToggleMotionGesture = React.useCallback(() => {
    dispatch(
      SettingsActions.setDevMenuSetting(
        'motionGestureEnabled',
        !devMenuSettings?.motionGestureEnabled
      )
    );
  }, [dispatch, devMenuSettings]);

  const theme = useExpoTheme();

  if (!devMenuSettings) {
    return null;
  }

  return (
    <>
      <View>
        <SectionHeader header="Experimental Settings" />
        <View bg="default" overflow="hidden" rounded="large" border="default">
          <CheckListItem
            icon={<ShakeDeviceIcon color={theme.icon.default} size={iconSize.regular} />}
            title="Ignore runtime version errors"
            checked={devMenuSettings.motionGestureEnabled}
            onPress={onToggleMotionGesture}
          />
        </View>
      </View>
      <Spacer.Vertical size="medium" />
    </>
  );
}
