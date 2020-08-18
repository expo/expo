import { take } from 'lodash';
import * as React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import FadeIn from 'react-native-fade-in-image';

import Colors from '../constants/Colors';
import ListItem from './ListItem';

const MAX_ICON_COUNT = 4;

type Props = {
  onPress: () => any;
  apps: any[];
  appCount: number;
  maxIconCount: number;
};

export default class SeeAllProjectsButton extends React.Component<Props> {
  static defaultProps = {
    apps: [],
    maxIconCount: MAX_ICON_COUNT,
  };

  render() {
    const { apps, appCount, maxIconCount, onPress } = this.props;

    if (!apps || !apps.length) {
      return <View />;
    }

    const otherAppCount = appCount - Math.min(apps.length, maxIconCount);

    return (
      <ListItem
        title="See all projects"
        rightContent={
          <View style={styles.appIconContainer}>
            {take(apps, maxIconCount).map((app, i) => {
              const image = app.iconUrl
                ? { uri: app.iconUrl }
                : require('../assets/placeholder-app-icon.png');
              return (
                <FadeIn key={i} placeholderColor="#eee">
                  <Image source={image} style={styles.appIcon} />
                </FadeIn>
              );
            })}

            {otherAppCount > 0 && (
              <View style={styles.projectsNumberContainer}>
                <Text style={styles.projectsNumberText}>+{otherAppCount}</Text>
              </View>
            )}
          </View>
        }
        arrowForward
        onPress={onPress}
        last
      />
    );
  }
}

const styles = StyleSheet.create({
  appIconContainer: {
    flexDirection: 'row',
  },
  appIcon: {
    width: 20,
    height: 20,
    marginRight: 3,
  },
  appIconPlaceholder: {
    width: 20,
    height: 20,
    marginRight: 3,
    backgroundColor: '#eee',
  },
  projectsNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.greyText,
    backgroundColor: 'transparent',
  },
  projectsNumberContainer: {
    height: 20,
    paddingHorizontal: 5,
    backgroundColor: '#eee',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
