import { ChevronDownIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Divider, Row, View, Text, useExpoTheme } from 'expo-dev-client-components';
import React, { Fragment } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { BranchManifest } from 'src/screens/BranchListScreen/BranchListView';

import { BranchListItem } from '../../components/BranchListItem';
import { ProjectsQuery } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

type ProjectPageApp = ProjectsQuery['app']['byId'];

export function EASUpdateLaunchSection({ app }: { app: ProjectPageApp }) {
  const branchesToRender = app.updateBranches.filter(
    (updateBranch) => updateBranch.updates.length > 0
  );

  const branchManifests: BranchManifest[] = branchesToRender.slice(0, 3).map((branch) => ({
    name: branch.name,
    id: branch.id,
    latestUpdate: branch.updates[0],
  }));

  const theme = useExpoTheme();
  const navigation = useNavigation<StackNavigationProp<HomeStackRoutes>>();

  function onSeeAllBranchesPress() {
    navigation.navigate('Branches', { appId: app.id });
  }

  if (branchManifests.length === 0) {
    return (
      <Text align="center" type="InterRegular" color="secondary" size="small">
        No EAS Update branches
      </Text>
    );
  }

  return (
    <View>
      {branchManifests.map((branch, i) => {
        return (
          <Fragment key={branch.id}>
            <BranchListItem
              first={i === 0}
              last={i === branchesToRender.length - 1}
              appId={app.id}
              name={branch.name}
              latestUpdate={branch.latestUpdate}
            />
            {i < branchManifests.length - 1 && <Divider style={{ height: 1 }} />}
          </Fragment>
        );
      })}
      {branchesToRender.length > 3 && (
        <View border="default" roundedBottom="large">
          <TouchableOpacity onPress={onSeeAllBranchesPress}>
            <View padding="medium" bg="default" roundedBottom="large">
              <Row align="center" justify="between">
                <Text type="InterRegular">See all branches</Text>
                <ChevronDownIcon
                  style={{ transform: [{ rotate: '-90deg' }] }}
                  color={theme.icon.secondary}
                />
              </Row>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
