import {
  Heading,
  View,
  Button,
  Divider,
  BranchIcon,
  Row,
  Spacer,
  Text,
  useExpoPalette,
} from 'expo-dev-client-components';
import * as React from 'react';

import { EASUpdateRow } from '../components/EASUpdatesRows';
import { FlatList } from '../components/FlatList';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { useBuildInfo } from '../providers/BuildInfoProvider';
import { useChannelsForApp } from '../queries/useChannelsForApp';
import { Update, useUpdatesForBranch } from '../queries/useUpdatesForBranch';

export function UpdatesScreen({ route }) {
  const { branchName } = route.params;
  const {
    data: updates,
    isLoading,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefreshing,
    isFetchingNextPage,
  } = useUpdatesForBranch(branchName);

  function Header() {
    return (
      <View py="small" px="large">
        <Heading size="small" color="secondary">
          Updates
        </Heading>
      </View>
    );
  }

  function Footer() {
    if (hasNextPage) {
      return <LoadMoreButton isLoading={isFetchingNextPage} onPress={fetchNextPage} />;
    }

    return null;
  }

  function renderUpdate({ index, item: update }: { index; item: Update }) {
    const isFirst = index === 0;
    const isLast = index === updates.length - 1;

    return (
      <View px="medium">
        <Button.ScaleOnPressContainer
          bg="default"
          onPress={() => {}}
          roundedBottom={isLast ? 'large' : 'none'}
          roundedTop={isFirst ? 'large' : 'none'}>
          <View
            bg="default"
            roundedTop={isFirst ? 'large' : 'none'}
            roundedBottom={isLast ? 'large' : 'none'}
            py="small"
            px="small">
            <EASUpdateRow update={update} />
          </View>
        </Button.ScaleOnPressContainer>
        {!isLast && <Divider />}
      </View>
    );
  }

  return (
    <View flex="1">
      <BranchDetailsHeader branchName={branchName} />
      <FlatList
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => refetch()}
        ListHeaderComponent={Header}
        data={updates}
        extraData={{ length: updates.length }}
        renderItem={renderUpdate}
        keyExtractor={(item) => item.id}
        ListFooterComponent={Footer}
      />
    </View>
  );
}

type BranchDetailsHeaderProps = {
  branchName: string;
};

function BranchDetailsHeader({ branchName }: BranchDetailsHeaderProps) {
  const palette = useExpoPalette();
  const { appId } = useBuildInfo();
  const { data: channels } = useChannelsForApp(appId);

  const availableChannels: string[] = [];

  channels?.forEach((channel) => {
    if (channel.branches.includes(branchName)) {
      availableChannels.push(branchName);
    }
  });

  return (
    <View bg="default" px="medium" py="large">
      <Row align="center">
        <View width="8">
          <BranchIcon />
        </View>

        <View>
          <Heading weight="bold">{branchName}</Heading>
        </View>

        <Spacer.Horizontal />

        <View>
          <Button.ScaleOnPressContainer bg="tertiary">
            <View px="2" py="1.5">
              <Button.Text size="small" weight="medium" color="tertiary">
                Open
              </Button.Text>
            </View>
          </Button.ScaleOnPressContainer>
        </View>
      </Row>

      {availableChannels.length > 0 && (
        <View mx="8">
          <Spacer.Vertical size="tiny" />
          <Row>
            <Text size="small" color="secondary">
              Available on:{' '}
            </Text>
            {availableChannels.map((channelName) => {
              return (
                <View
                  key={channelName}
                  rounded="medium"
                  px="1.5"
                  py="1"
                  style={{ backgroundColor: palette.orange['000'] }}>
                  <Text size="small" color="secondary">{`Channel: ${channelName}`}</Text>
                </View>
              );
            })}
          </Row>
        </View>
      )}
    </View>
  );
}
