import { ChevronDownIcon } from '@expo/styleguide-native';
import { PressableOpacity } from 'components/PressableOpacity';
import { Row, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { AppIcon } from './AppIcon';

type Props = {
  imageURL?: string;
  name: string;
  onPress: () => void;
};

/**
 * This component is used to render a list item for the projects section on the homescreen and on
 * the projects list page for an account.
 */

export function ProjectsListItem({ imageURL, name, onPress }: Props) {
  const theme = useExpoTheme();

  return (
    <PressableOpacity onPress={onPress}>
      <View padding="medium">
        <Row align="center" justify="between">
          <Row align="center">
            <AppIcon image={imageURL} />
            <Text style={styles.titleText} ellipsizeMode="tail" numberOfLines={1}>
              {name}
            </Text>
          </Row>
          <ChevronDownIcon
            style={{ transform: [{ rotate: '-90deg' }] }}
            color={theme.icon.secondary}
          />
        </Row>
      </View>
    </PressableOpacity>
  );
}

const styles = StyleSheet.create({
  titleText: {
    fontSize: 15,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
      android: {
        fontWeight: '400',
        marginTop: 1,
      },
    }),
  },
});
