'use client';
import { Image, StyleSheet } from 'react-native';
import toggleDrawerIcon from '../../../../../assets/react-navigation/drawer/toggle-drawer-icon.png';
import { HeaderButton } from '../../elements';
import { DrawerActions, useNavigation } from '../../native';
export function DrawerToggleButton({ tintColor, accessibilityLabel = 'Show navigation menu', imageSource = toggleDrawerIcon, ...rest }) {
    const navigation = useNavigation();
    return (<HeaderButton {...rest} accessibilityLabel={accessibilityLabel} onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
      <Image resizeMode="contain" source={imageSource} fadeDuration={0} tintColor={tintColor} style={styles.icon}/>
    </HeaderButton>);
}
const styles = StyleSheet.create({
    icon: {
        height: 24,
        width: 24,
        marginVertical: 8,
        marginHorizontal: 5,
    },
});
//# sourceMappingURL=DrawerToggleButton.js.map