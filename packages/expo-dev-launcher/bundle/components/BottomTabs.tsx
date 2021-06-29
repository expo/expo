import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';

import { openProfile, openSettings } from '../DevMenu';
import { MainText } from '../components/Text';
import { MainView } from '../components/Views';
import { useTheme } from '../hooks/useThemeName';

type Props = {
  height: number;
};

export default (props: Props) => {
  const [colors] = useTheme();
  const imageColor = { tintColor: colors.text };
  return (
    <MainView style={[styles.bottomTabsAbsoluteContainer, { height: props.height }]}>
      <View style={styles.bottomTabsContainer}>
        <TouchableOpacity style={styles.bottomTabsItemContainer} onPress={openProfile}>
          <View style={styles.bottomTabsItem}>
            <Image
              style={[styles.icon, imageColor]}
              source={require('../assets/user-filled-icon.png')}
            />
            <MainText style={styles.bottomTabsItemText}>Profile</MainText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomTabsItemContainer} onPress={openSettings}>
          <View style={styles.bottomTabsItem}>
            <Image
              style={[styles.icon, imageColor]}
              source={require('../assets/settings-filled-icon.png')}
            />
            <MainText style={styles.bottomTabsItemText}>Settings</MainText>
          </View>
        </TouchableOpacity>
      </View>
    </MainView>
  );
};

const styles = StyleSheet.create({
  bottomTabsAbsoluteContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    borderTopWidth: 1,
  },
  bottomTabsContainer: {
    width: '100%',
    height: '100%',
    flex: 1,
    flexDirection: 'row',
  },
  bottomTabsItemContainer: {
    flexGrow: 1,
  },
  bottomTabsItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabsItemText: {
    fontSize: 12,
    marginTop: 5,
  },
  icon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
});
