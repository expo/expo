import React from 'react';
import { Text, View, StyleSheet, TouchableHighlight } from 'react-native';

import { DevMenu } from '../DevMenu';

type Props = {
  height: number;
};

export default class BottomTabs extends React.Component<Props, object> {
  render() {
    return (
      <View style={[styles.bottomTabsAbsoluteContainer, { height: this.props.height }]}>
        <View style={styles.bottomTabsContainer}>
          <TouchableHighlight
            underlayColor="#ddd"
            style={styles.bottomTabsItem}
            onPress={() => {
              DevMenu.openProfile?.();
            }}>
            <Text style={styles.bottomTabsItemContent}>Profile</Text>
          </TouchableHighlight>

          <TouchableHighlight
            underlayColor="#ddd"
            style={styles.bottomTabsItem}
            onPress={() => {
              DevMenu.openMenu?.();
            }}>
            <Text style={styles.bottomTabsItemContent}>Menu</Text>
          </TouchableHighlight>

          <TouchableHighlight
            underlayColor="#ddd"
            style={styles.bottomTabsItem}
            onPress={() => {
              DevMenu.openSettings?.();
            }}>
            <Text style={styles.bottomTabsItemContent}>Settings</Text>
          </TouchableHighlight>
        </View>
      </View>
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
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderTopWidth: 0.8,
    borderWidth: 0.3,
    justifyContent: 'center',
  },
  bottomTabsItemContent: {
    alignSelf: 'center',
    color: '#000',
    fontSize: 12,
  },
});
