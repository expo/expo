'use client';
import { type ColorValue, Image, type ImageSourcePropType, StyleSheet } from 'react-native';

import toggleDrawerIcon from '../../../../assets/react-navigation/drawer/toggle-drawer-icon.png';
import { HeaderButton } from '../../elements';
import { useDrawerActions } from '../utils/useDrawerActions';

type Props = {
  accessibilityLabel?: string;
  pressColor?: ColorValue;
  pressOpacity?: number;
  tintColor?: ColorValue;
  imageSource?: ImageSourcePropType;
};

export function DrawerToggleButton({
  tintColor,
  accessibilityLabel = 'Show navigation menu',
  imageSource = toggleDrawerIcon,
  ...rest
}: Props) {
  const { toggleDrawer } = useDrawerActions();

  return (
    <HeaderButton {...rest} accessibilityLabel={accessibilityLabel} onPress={() => toggleDrawer()}>
      <Image
        resizeMode="contain"
        source={imageSource}
        fadeDuration={0}
        tintColor={tintColor}
        style={styles.icon}
      />
    </HeaderButton>
  );
}

const styles = StyleSheet.create({
  icon: {
    height: 24,
    width: 24,
    marginVertical: 8,
    marginHorizontal: 5,
  },
});
