import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

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
import { Linking } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { BasicButton } from '../components/BasicButton';
import { EASUpdateRow } from '../components/EASUpdatesRows';
import { FlatList } from '../components/FlatList';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { Toasts } from '../components/Toasts';
import { useBuildInfo } from '../providers/BuildInfoProvider';
import { useToastStack } from '../providers/ToastStackProvider';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { useChannelsForApp } from '../queries/useChannelsForApp';
import { Update, useUpdatesForBranch } from '../queries/useUpdatesForBranch';
import { ExtensionsStackParamList } from './ExtensionsStack';

type UpdatesScreenProps = {
  navigation: StackNavigationProp<ExtensionsStackParamList, 'Updates'>;
  route: RouteProp<ExtensionsStackParamList, 'Updates'>;
};

export function UpdatesScreen({ route }: UpdatesScreenProps) {
  const { runtimeVersion } = useBuildInfo();
  const { branchName } = route.params;
  const toastStack = useToastStack();

  const {
    data: updates,
    isLoading,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefreshing,
    isFetchingNextPage,
  } = useUpdatesForBranch(branchName);

  const onUpdatePress = React.useCallback(
    (update: Update) => {
      const isCompatible = update.runtimeVersion === runtimeVersion;

      if (
        !isCompatible &&
        // prevent multiple taps bringing up multiple of the same toast
        toastStack.getItems().filter((i) => i.status === 'pushing' || i.status === 'settled')
          .length === 0
      ) {
        toastStack.push(
          () => (
            <Toasts.Warning>
              {`To run this update, you need a compatible development build with runtime version ${update.runtimeVersion}.`}
            </Toasts.Warning>
          ),
          { durationMs: 10000 }
        );
      }
    },
    [runtimeVersion, branchName]
  );

  function Header() {
    if (updates.length === 0) {
      return null;
    }

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

  function EmptyList() {
    return (
      <View mt="large" mx="medium" bg="default" rounded="large" padding="medium">
        <View>
          <Heading>There are no updates available for this branch.</Heading>
          <Spacer.Vertical size="small" />
          <Text color="secondary" size="small">
            Updates allow you to deliver code directly to your users.
          </Text>

          <View py="medium" align="centered">
            <Button.ScaleOnPressContainer
              bg="tertiary"
              onPress={() => {
                Linking.openURL(`https://docs.expo.dev/eas-update/how-eas-update-works/`);
              }}>
              <View px="2.5" py="2">
                <Button.Text weight="medium" color="tertiary">
                  Publish an update
                </Button.Text>
              </View>
            </Button.ScaleOnPressContainer>
          </View>
        </View>
      </View>
    );
  }

  function renderUpdate({ index, item: update }: { index; item: Update }) {
    const isFirst = index === 0;
    const isLast = index === updates.length - 1;

    const isCompatibleUpdate = update.runtimeVersion === runtimeVersion;

    return (
      <View px="medium" opacity={isCompatibleUpdate ? '1' : '0.5'}>
        <Button.ScaleOnPressContainer
          bg="default"
          onPress={() => onUpdatePress(update)}
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
      <BranchDetailsHeader
        branchName={branchName}
        updates={updates}
        onOpenPress={() => onUpdatePress(updates[0])}
      />
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
        ListEmptyComponent={EmptyList}
      />
    </View>
  );
}

type BranchDetailsHeaderProps = {
  branchName: string;
  updates: Update[];
  onOpenPress: () => void;
};

function BranchDetailsHeader({ branchName, updates, onOpenPress }: BranchDetailsHeaderProps) {
  const { appId } = useUpdatesConfig();
  const { data: channels } = useChannelsForApp(appId);

  const availableChannels: string[] = [];

  channels?.forEach((channel) => {
    if (channel.branches.includes(branchName)) {
      availableChannels.push(branchName);
    }
  });

  const hasUpdates = updates.length > 0;

  return (
    <View bg="default" px="medium" py="medium">
      <Row align="center">
        <View width="8">
          <BranchIcon />
        </View>

        <View>
          <Heading weight="bold">{branchName}</Heading>
        </View>

        <Spacer.Horizontal />
        {hasUpdates && <BasicButton label="Open Latest" onPress={onOpenPress} py="1.5" px="2" />}
      </Row>
      {availableChannels.length > 0 && (
        <>
          <Spacer.Vertical size="medium" />
          <AvailableChannelsList channels={availableChannels} />
        </>
      )}
    </View>
  );
}

function AvailableChannelsList({ channels }) {
  const palette = useExpoPalette();

  if (channels.length === 0) {
    return null;
  }

  return (
    <View>
      <Row align="center">
        <Text size="small" color="secondary">
          Available on:{' '}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row>
            {channels.map((channelName) => {
              return (
                <View key={channelName}>
                  <View
                    align="start"
                    key={channelName}
                    rounded="medium"
                    px="1.5"
                    mx="0.5"
                    py="1"
                    style={{ backgroundColor: palette.orange['000'] }}>
                    <Text size="small" color="secondary">{`Channel: ${channelName}`}</Text>
                  </View>
                </View>
              );
            })}
          </Row>
        </ScrollView>
      </Row>
    </View>
  );
}
