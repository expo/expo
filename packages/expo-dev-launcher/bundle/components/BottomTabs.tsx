import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { openProfile, openMenu, openSettings } from '../DevMenu';
import { MainText } from '../components/Text';
import { MainView } from '../components/Views';

type Props = {
  height: number;
};

export default class BottomTabs extends React.Component<Props, object> {
  render() {
    return (
      <MainView style={[styles.bottomTabsAbsoluteContainer, { height: this.props.height }]}>
        <View style={styles.bottomTabsContainer}>
          <TouchableOpacity style={styles.bottomTabsItem} onPress={openProfile}>
            <MainText style={styles.bottomTabsItemContent}>Profile</MainText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomTabsItem, { borderLeftWidth: 0.5, borderRightWidth: 0.5 }]}
            onPress={openMenu}>
            <MainText style={styles.bottomTabsItemContent}>Menu</MainText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomTabsItem} onPress={openSettings}>
            <MainText style={styles.bottomTabsItemContent}>Settings</MainText>
          </TouchableOpacity>
        </View>
      </MainView>
    );
  }
}

const styles = StyleSheet.create({
  bottomTabsAbsoluteContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  bottomTabsContainer: {
    width: '100%',
    height: '100%',
    flex: 1,
    flexDirection: 'row',
  },
  bottomTabsItem: {
    flexGrow: 1,
    borderTopWidth: 0.5,
    justifyContent: 'center',
  },
  bottomTabsItemContent: {
    alignSelf: 'center',
    fontSize: 12,
  },
});
