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
  scale,
} from 'expo-dev-client-components';
import * as React from 'react';
import { Animated, Linking } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { BasicButton } from '../components/BasicButton';
import { EASUpdateRow } from '../components/EASUpdatesRows';
import { FlatList } from '../components/FlatList';
import { ScreenContainer } from '../components/ScreenContainer';
import { useOnUpdatePress } from '../hooks/useOnUpdatePress';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { useChannelsForApp } from '../queries/useChannelsForApp';
import { Update, useUpdatesForBranch } from '../queries/useUpdatesForBranch';
import { ExtensionsStackParamList } from './ExtensionsStack';

type UpdatesScreenProps = {
  navigation: StackNavigationProp<ExtensionsStackParamList, 'Updates'>;
  route: RouteProp<ExtensionsStackParamList, 'Updates'>;
};

export function UpdatesScreen({ route }: UpdatesScreenProps) {
  const { runtimeVersion } = useUpdatesConfig();
  const { branchName } = route.params;
  const [hasPressedLoadMore, setHasPressedLoadMore] = React.useState(false);

  const {
    data: updates,
    isLoading,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefreshing,
    isFetchingNextPage,
  } = useUpdatesForBranch(branchName);

  function onLoadMorePress() {
    setHasPressedLoadMore(true);
    fetchNextPage();
  }

  const { onUpdatePress, loadingUpdateId } = useOnUpdatePress();

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
      return (
        <View align="centered" mt="large">
          <BasicButton
            label="Load More"
            isLoading={isFetchingNextPage}
            onPress={onLoadMorePress}
            size="small"
          />
        </View>
      );
    }

    if (updates.length > 0 && hasPressedLoadMore) {
      return <EndReachedMessage />;
    }

    return null;
  }

  function EmptyList() {
    return (
      <ScreenContainer>
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
      </ScreenContainer>
    );
  }

  function renderUpdate({ index, item: update }: { index; item: Update }) {
    const isFirst = index === 0;
    const isLast = index === updates.length - 1;

    const isCompatibleUpdate = update.runtimeVersion === runtimeVersion;
    const isLoading = update.id === loadingUpdateId;

    return (
      <View px="medium" opacity={isCompatibleUpdate ? '1' : '0.5'}>
        <EASUpdateRow
          update={update}
          isFirst={isFirst}
          isLast={isLast}
          isLoading={isLoading}
          onPress={() => onUpdatePress(update)}
        />
        {!isLast && <Divider />}
      </View>
    );
  }

  return (
    <ScreenContainer>
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
          extraData={{ length: updates.length, loadingUpdateId }}
          renderItem={renderUpdate}
          keyExtractor={(item) => item.id}
          ListFooterComponent={Footer}
          ListEmptyComponent={EmptyList}
        />
      </View>
    </ScreenContainer>
  );
}

type BranchDetailsHeaderProps = {
  branchName: string;
  updates: Update[];
  onOpenPress: () => void;
};

function BranchDetailsHeader({ branchName, updates, onOpenPress }: BranchDetailsHeaderProps) {
  const { appId, runtimeVersion } = useUpdatesConfig();
  const { data: channels } = useChannelsForApp(appId);

  const availableChannels: string[] = [];

  channels?.forEach((channel) => {
    if (channel.branches.includes(branchName)) {
      availableChannels.push(branchName);
    }
  });

  const hasUpdates = updates.length > 0;
  const latestUpdate = updates[0];
  const isLatestUpdateCompatible = latestUpdate?.runtimeVersion === runtimeVersion;

  return (
    <View bg="default" px="medium" py="medium">
      <Row align="center">
        <View width="8">
          <BranchIcon />
        </View>

        <View shrink="1">
          <Heading weight="bold" numberOfLines={2}>
            {branchName}
          </Heading>
        </View>

        <Spacer.Horizontal />
        {hasUpdates && (
          <View
            opacity={isLatestUpdateCompatible ? '1' : '0.75'}
            style={{ marginLeft: scale.small }}>
            <BasicButton label="Open Latest" onPress={onOpenPress} size="small" />
          </View>
        )}
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
                    <Text size="small">{`Channel: ${channelName}`}</Text>
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

function EndReachedMessage() {
  const animatedValue = React.useRef(new Animated.Value(1));

  React.useEffect(() => {
    Animated.timing(animatedValue.current, {
      toValue: 0,
      duration: 800,
      delay: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: animatedValue.current }}>
      <View mt="medium">
        <Text align="center" size="small" color="secondary">
          There are no more updates for this branch!
        </Text>
      </View>
    </Animated.View>
  );
}
