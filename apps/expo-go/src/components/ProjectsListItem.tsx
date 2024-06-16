import { ChevronDownIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CommonAppDataFragment } from 'src/graphql/types';
import {
  isUpdateCompatibleWithThisExpoGo,
  openUpdateManifestPermalink,
} from 'src/utils/UpdateUtils';

import { HomeStackRoutes } from '../navigation/Navigation.types';
import { AppIcon } from '../screens/HomeScreen/AppIcon';

type Props = {
  name: string;
  firstTwoBranches: CommonAppDataFragment['firstTwoBranches'];
  subtitle?: string;
  id: string;
  first: boolean;
  last: boolean;
};

/**
 * This component is used to render a list item for the projects section on the homescreen and on
 * the projects list page for an account.
 */

export function ProjectsListItem({ name, subtitle, firstTwoBranches, id, first, last }: Props) {
  const theme = useExpoTheme();

  const navigation = useNavigation<StackNavigationProp<HomeStackRoutes>>();

  function onPress() {
    // if there's only one branch for the project and there's only one update on that branch and
    // it is compatible with this version of Expo Go, just launch it upon tapping the row instead of entering
    // a drill-down UI for exploring branches/updates.
    if (firstTwoBranches.length === 1) {
      const branch = firstTwoBranches[0];
      if (branch.updates.length === 1) {
        const updateToOpen = branch.updates[0];
        const isCompatibleWithThisExpoGo = isUpdateCompatibleWithThisExpoGo(updateToOpen);
        if (isCompatibleWithThisExpoGo) {
          openUpdateManifestPermalink(updateToOpen);
        } else {
          navigation.push('ProjectDetails', { id });
        }
      } else {
        navigation.push('ProjectDetails', { id });
      }
    } else {
      navigation.push('ProjectDetails', { id });
    }
  }

  const showSubtitle = subtitle && name.toLowerCase() !== subtitle.toLowerCase();

  return (
    <View
      border="default"
      roundedTop={first ? 'large' : undefined}
      roundedBottom={last ? 'large' : undefined}
      overflow="hidden"
      style={{
        borderBottomWidth: last ? 1 : 0,
        borderTopWidth: first ? 1 : 0,
      }}>
      <TouchableOpacity onPress={onPress}>
        <View
          padding="medium"
          bg="default"
          roundedTop={first ? 'large' : undefined}
          roundedBottom={last ? 'large' : undefined}>
          <Row align="center" justify="between">
            <Row align="center" flex="1">
              <AppIcon />
              <View flex="1">
                <Text
                  type="InterSemiBold"
                  style={styles.titleText}
                  ellipsizeMode="tail"
                  numberOfLines={1}>
                  {name}
                </Text>
                {showSubtitle ? (
                  <>
                    <Spacer.Vertical size="micro" />
                    <Text
                      type="InterRegular"
                      size="small"
                      color="secondary"
                      ellipsizeMode="tail"
                      numberOfLines={1}>
                      {subtitle}
                    </Text>
                  </>
                ) : null}
              </View>
            </Row>
            <ChevronDownIcon
              style={{ transform: [{ rotate: '-90deg' }] }}
              color={theme.icon.secondary}
            />
          </Row>
        </View>
      </TouchableOpacity>
    </View>
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
