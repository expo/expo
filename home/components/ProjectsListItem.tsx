import { ChevronDownIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React from 'react';
import { Platform, StyleSheet, Linking } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { CommonAppDataFragment } from '../graphql/types';
import { HomeStackRoutes } from '../navigation/Navigation.types';
import { AppIcon } from '../screens/HomeScreen/AppIcon';
import * as UrlUtils from '../utils/UrlUtils';
import { useSDKExpired } from '../utils/useSDKExpired';

type UpdateBranches = CommonAppDataFragment['updateBranches'];
type UpdateBranch = UpdateBranches[number];

type Props = {
  imageURL?: string;
  name: string;
  fullName: string;
  subtitle?: string;
  sdkVersion?: string;
  id: string;
  first: boolean;
  last: boolean;
  updateBranches: UpdateBranches;
};

function hasEASUpdates(updateBranches: UpdateBranches): boolean {
  return updateBranches.some((branch: UpdateBranch) => branch.updates.length > 0);
}

/**
 * This component is used to render a list item for the projects section on the homescreen and on
 * the projects list page for an account.
 */

export function ProjectsListItem({
  imageURL,
  name,
  subtitle,
  sdkVersion,
  id,
  first,
  last,
  updateBranches,
  fullName,
}: Props) {
  const theme = useExpoTheme();
  const [isExpired, sdkVersionNumber] = useSDKExpired(sdkVersion);

  const navigation = useNavigation<StackNavigationProp<HomeStackRoutes>>();

  function onPress() {
    if (hasEASUpdates(updateBranches)) {
      navigation.push('ProjectDetails', { id });
    } else {
      Linking.openURL(UrlUtils.normalizeUrl(fullName));
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
              <AppIcon image={imageURL} />
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
                {sdkVersionNumber ? (
                  <>
                    <Spacer.Vertical size="micro" />
                    <Text
                      type="InterRegular"
                      size="small"
                      color="secondary"
                      ellipsizeMode="tail"
                      numberOfLines={1}>
                      SDK {sdkVersionNumber}
                      {isExpired ? ': Not supported' : ''}
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
