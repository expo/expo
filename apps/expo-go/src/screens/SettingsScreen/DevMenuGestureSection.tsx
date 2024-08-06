import { iconSize } from '@expo/styleguide-native';
import { Divider, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';

import { CheckListItem } from './CheckListItem';
import { ShakeDeviceIcon } from './ShakeDeviceIcon';
import { ThreeFingerPressIcon } from './ThreeFingerPressIcon';
import { SectionHeader } from '../../components/SectionHeader';
import { useDispatch, useSelector } from '../../redux/Hooks';
import SettingsActions from '../../redux/SettingsActions';

export function DevMenuGestureSection() {
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

  const onToggleTouchGesture = React.useCallback(() => {
    dispatch(
      SettingsActions.setDevMenuSetting(
        'touchGestureEnabled',
        !devMenuSettings?.touchGestureEnabled
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
        <SectionHeader header="Developer Menu Gestures" />
        <View bg="default" overflow="hidden" rounded="large" border="default">
          <CheckListItem
            icon={<ShakeDeviceIcon color={theme.icon.default} size={iconSize.regular} />}
            title="Shake device"
            checked={devMenuSettings.motionGestureEnabled}
            onPress={onToggleMotionGesture}
          />
          <Divider style={{ height: 1 }} />
          <CheckListItem
            icon={<ThreeFingerPressIcon color={theme.icon.default} size={iconSize.regular} />}
            title="Three-finger long press"
            checked={devMenuSettings.touchGestureEnabled}
            onPress={onToggleTouchGesture}
          />
        </View>
        <View py="small" px="medium">
          <Text size="small" color="secondary" type="InterRegular">
            Selected gestures will toggle the developer menu while inside an experience. The menu
            allows you to reload or return to home in a published experience, and exposes developer
            tools in development mode.
          </Text>
        </View>
      </View>
      <Spacer.Vertical size="medium" />
    </>
  );
}
