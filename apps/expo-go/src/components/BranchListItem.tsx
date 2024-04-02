import { BranchIcon, UpdateIcon, iconSize, ChevronDownIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import format from 'date-fns/format';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { DateFormats } from '../constants/DateFormats';
import { ProjectsQuery } from '../graphql/types';
import { HomeStackRoutes } from '../navigation/Navigation.types';

type Update = ProjectsQuery['app']['byId']['updateBranches'][number]['updates'][number];

type Props = {
  name: string;
  latestUpdate?: Update;
  appId: string;
  first: boolean;
  last: boolean;
};

/**
 * This component is used to render a list item for the branches section on the project screen and on
 * the branches list page for an app.
 */

export function BranchListItem({ name, appId, latestUpdate, first, last }: Props) {
  const theme = useExpoTheme();

  const navigation = useNavigation<StackNavigationProp<HomeStackRoutes>>();

  const handlePressBranch = () => {
    navigation.navigate('BranchDetails', { appId, branchName: name });
  };

  return (
    <View
      border="default"
      roundedTop={first ? 'large' : undefined}
      roundedBottom={last ? 'large' : undefined}
      style={{
        borderBottomWidth: last ? 1 : 0,
        borderTopWidth: first ? 1 : 0,
      }}>
      <TouchableOpacity onPress={handlePressBranch}>
        <View
          padding="medium"
          bg="default"
          roundedTop={first ? 'large' : undefined}
          roundedBottom={last ? 'large' : undefined}>
          <Row align="center" justify="between">
            <View align="start" flex="1">
              <Row align="center">
                <BranchIcon color={theme.icon.default} size={iconSize.small} />
                <Spacer.Horizontal size="tiny" />
                <Text ellipsizeMode="tail" numberOfLines={1} type="InterMedium">
                  Branch: {name}
                </Text>
              </Row>
              {latestUpdate?.message && (
                <>
                  <View flex="0" height="2" />
                  <Row flex="1">
                    <Spacer.Horizontal size="medium" />
                    <UpdateIcon color={theme.icon.secondary} size={iconSize.small} />
                    <Spacer.Horizontal size="tiny" />
                    <View flex="1">
                      <Text
                        type="InterRegular"
                        color="secondary"
                        size="small"
                        ellipsizeMode="middle"
                        numberOfLines={1}>
                        "{latestUpdate.message}"
                      </Text>
                      <Spacer.Vertical size="tiny" />
                      <Text
                        type="InterRegular"
                        color="secondary"
                        size="small"
                        ellipsizeMode="tail"
                        numberOfLines={1}>
                        Published {format(new Date(latestUpdate.createdAt), DateFormats.timestamp)}
                      </Text>
                    </View>
                  </Row>
                </>
              )}
            </View>
            <Spacer.Horizontal size="tiny" />
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
