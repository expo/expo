import { getSDKVersionFromRuntimeVersion } from '@expo/sdk-runtime-versions';
import { ChevronDownIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Divider, Row, View, Text, useExpoTheme } from 'expo-dev-client-components';
import React, { Fragment } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';
import semver from 'semver';

import { BranchListItem } from '../../components/BranchListItem';
import { SectionHeader } from '../../components/SectionHeader';
import { WebContainerProjectPage_Query } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

type ProjectPageApp = WebContainerProjectPage_Query['app']['byId'];
type ProjectUpdateBranch = WebContainerProjectPage_Query['app']['byId']['updateBranches'][0];

function truthy<TValue>(value: TValue | null | undefined): value is TValue {
  return !!value;
}

export function getSDKMajorVersionForEASUpdateBranch(branch: ProjectUpdateBranch): number | null {
  const updates = branch.updates;
  if (updates.length === 0) {
    return null;
  }

  return (
    updates
      .map((update) => {
        const potentialSDKVersion = getSDKVersionFromRuntimeVersion(update.runtimeVersion);
        return potentialSDKVersion ? semver.major(potentialSDKVersion) : null;
      })
      .filter(truthy)
      .sort((a, b) => b - a)[0] ?? null
  );
}

export function EASUpdateLaunchSection({ app }: { app: ProjectPageApp }) {
  const branchesToRender = app.updateBranches.filter(
    (updateBranch) => updateBranch.updates.length > 0
  );

  const branchManifests = branchesToRender.slice(0, 3).map((branch) => ({
    name: branch.name,
    id: branch.id,
    latestUpdate: branch.updates[0],
    sdkVersion: getSDKMajorVersionForEASUpdateBranch(branch),
  }));

  const theme = useExpoTheme();
  const navigation = useNavigation<StackNavigationProp<HomeStackRoutes>>();

  function onSeeAllBranchesPress() {
    navigation.navigate('Branches', { appId: app.id });
  }

  return (
    <View>
      <SectionHeader header="Branches" style={{ paddingTop: 0 }} />
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
