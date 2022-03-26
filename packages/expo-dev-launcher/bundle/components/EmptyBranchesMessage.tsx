import { Spacer, View, Text, Button, Heading } from 'expo-dev-client-components';
import * as React from 'react';

import { useBuildInfo } from '../providers/BuildInfoProvider';
import { Branch } from '../queries/useBranchesForApp';

type EmptyBranchesMessageProps = {
  branches: Branch[];
  incompatibleBranches: Branch[];
  onLearnMorePress: () => void;
};

export function EmptyBranchesMessage({
  branches = [],
  incompatibleBranches = [],
  onLearnMorePress,
}: EmptyBranchesMessageProps) {
  const { runtimeVersion } = useBuildInfo();

  // no compatible branches
  if (branches.length === 0 && incompatibleBranches.length > 0) {
    const recentBranchWithUpdates = incompatibleBranches.find(
      (branch) => branch.updates.length > 0
    );
    const latestRuntimeVersion = recentBranchWithUpdates?.updates?.[0].runtimeVersion;

    return (
      <View padding="medium" rounded="large" bg="default">
        <View>
          <Heading>The runtime version of this app has no compatible branches.</Heading>
          <Spacer.Vertical size="small" />
          <Text
            color="secondary"
            size="small">{`However there are ${incompatibleBranches.length} branches that will work with a different runtime version - you might need to update your development build.`}</Text>
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
            <Button.ScaleOnPressContainer bg="tertiary" onPress={onLearnMorePress}>
              <View px="2.5" py="2">
                <Button.Text weight="medium" color="tertiary">
                  See Available Builds
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
            <Button.ScaleOnPressContainer bg="tertiary">
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
