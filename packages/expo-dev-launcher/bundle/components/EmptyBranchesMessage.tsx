import { Spacer, View, Text, Button, Heading } from 'expo-dev-client-components';
import * as React from 'react';
import { Linking } from 'react-native';
import { websiteOrigin } from '../apiClient';

import { useBuildInfo } from '../providers/BuildInfoProvider';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { useUser } from '../providers/UserContextProvider';
import { Branch } from '../queries/useBranchesForApp';

type EmptyBranchesMessageProps = {
  branches: Branch[];
  incompatibleBranches: Branch[];
};

export function EmptyBranchesMessage({
  branches = [],
  incompatibleBranches = [],
}: EmptyBranchesMessageProps) {
  const { runtimeVersion } = useUpdatesConfig();
  const { appName } = useBuildInfo();
  const { selectedAccount } = useUser();

  // no compatible branches
  if (branches.length === 0 && incompatibleBranches.length > 0) {
    const recentBranchWithUpdates = incompatibleBranches.find(
      (branch) => branch.updates.length > 0
    );
    const latestRuntimeVersion = recentBranchWithUpdates?.updates?.[0].runtimeVersion;

    return (
      <View padding="medium" rounded="large" bg="default">
        <View>
          <Heading>There are no branches compatible with this development build.</Heading>
          <Spacer.Vertical size="small" />
          <Text color="secondary" size="small">
            {getCompatibleBranchMessage(incompatibleBranches.length)}
          </Text>
          <Spacer.Vertical size="small" />
          <Text
            color="secondary"
            size="small">{`The runtime version of this development build is "${runtimeVersion}".`}</Text>
          <Spacer.Vertical size="small" />
          <Text color="secondary" size="small">
            {Boolean(latestRuntimeVersion != null) &&
              `A recent update was published with the runtime version "${latestRuntimeVersion}".`}
          </Text>

          <Spacer.Vertical size="large" />

          <View align="centered">
            <Button.ScaleOnPressContainer
              bg="tertiary"
              onPress={() =>
                Linking.openURL(
                  `${websiteOrigin}/accounts/${selectedAccount.name}/projects/${appName}/builds`
                )
              }>
              <View px="2.5" py="2">
                <Button.Text weight="medium" color="tertiary">
                  See Development Builds
                </Button.Text>
              </View>
            </Button.ScaleOnPressContainer>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View padding="medium" rounded="large" bg="default">
      <View>
        <View>
          <Heading>This app has no published branches yet.</Heading>
          <Spacer.Vertical size="small" />

          <Spacer.Vertical size="small" />
          <Text color="secondary" size="small">
            Branches allow you to deliver code to builds through EAS Update.
          </Text>

          <View py="medium" align="centered">
            <Button.ScaleOnPressContainer
              bg="tertiary"
              onPress={() =>
                Linking.openURL(`https://docs.expo.dev/eas-update/how-eas-update-works/`)
              }>
              <View px="2.5" py="2">
                <Button.Text weight="medium" color="tertiary">
                  Create a branch
                </Button.Text>
              </View>
            </Button.ScaleOnPressContainer>
          </View>
        </View>
      </View>
    </View>
  );
}

export function getCompatibleBranchMessage(numberOfCompatibleBranches: number) {
  if (numberOfCompatibleBranches === 1) {
    return `However, there is a branch that is compatible with a different runtime version. You may need to publish a new update or install a new development build.`;
  }

  return `However, there are ${numberOfCompatibleBranches} branches that are compatible with a different runtime version. You may need to publish a new update or install a new development build.`;
}
