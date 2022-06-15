import { StackNavigationProp } from '@react-navigation/stack';
import {
  Heading,
  Spacer,
  View,
  Text,
  useExpoPalette,
  Row,
  ChevronRightIcon,
  BranchIcon,
  UpdateIcon,
  scale,
} from 'expo-dev-client-components';
import * as React from 'react';
import { Animated } from 'react-native';

import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { Branch } from '../queries/useBranchesForApp';
import { Update } from '../queries/useUpdatesForBranch';
import { ExtensionsStackParamList } from '../screens/ExtensionsStack';
import { ActivityIndicator } from './ActivityIndicator';
import { BasicButton } from './BasicButton';
import { ListButton } from './ListButton';

type EASBranchRowProps = {
  branch: Branch;
  isFirst?: boolean;
  isLast?: boolean;
  navigation: StackNavigationProp<ExtensionsStackParamList>;
  isLoading?: boolean;
  onUpdatePress: (update: Update) => void;
};

export function EASBranchRow({
  branch,
  isFirst,
  isLast,
  isLoading,
  onUpdatePress,
  navigation,
}: EASBranchRowProps) {
  const loadingStyle = useLoadingContainerStyle(isLoading);

  const palette = useExpoPalette();
  const { runtimeVersion } = useUpdatesConfig();

  const { name, updates } = branch;
  const latestUpdate = updates[0];
  const isLatestUpdateCompatible = latestUpdate?.runtimeVersion === runtimeVersion;

  function onBranchPress() {
    navigation.navigate('Updates', { branchName: branch.name });
  }

  return (
    <Animated.View style={loadingStyle}>
      <ListButton isFirst={isFirst} isLast={isLast} onPress={onBranchPress}>
        <Row align="center">
          <Row
            shrink="1"
            style={{
              backgroundColor: palette.blue['100'],
            }}
            py="tiny"
            px="1.5"
            rounded="medium"
            align="center">
            <BranchIcon
              style={{ maxHeight: 10, maxWidth: 12, resizeMode: 'contain' }}
              resizeMethod="scale"
            />
            <Spacer.Horizontal size="tiny" />
            <View shrink="1">
              <Text size="small" numberOfLines={1}>{`Branch: ${name}`}</Text>
            </View>
          </Row>
          <Spacer.Horizontal />
          <View style={{ paddingLeft: scale.small }}>
            <ChevronRightIcon />
          </View>
        </Row>

        <Spacer.Vertical size="small" />

        {latestUpdate != null && (
          <Row>
            <View>
              <Spacer.Vertical size="tiny" />
              <UpdateIcon />
            </View>
            <Spacer.Horizontal size="small" />
            <View flex="1" shrink="1">
              <Heading size="small" numberOfLines={1}>
                {`Update "${latestUpdate.message}"`}
              </Heading>
              <Spacer.Horizontal size="large" />
              <Spacer.Vertical size="tiny" />
              <Text size="small" color="secondary">
                {`Published ${latestUpdate?.createdAt}`}
              </Text>
            </View>
            <Spacer.Horizontal size="large" />
            <Spacer.Vertical size="small" />
            <View align="centered" opacity={isLatestUpdateCompatible ? '1' : '0.5'}>
              <BasicButton label="Open" size="small" onPress={() => onUpdatePress(latestUpdate)} />
            </View>
          </Row>
        )}

        <Spacer.Vertical size="small" />
      </ListButton>

      {isLoading && (
        <View inset="full" align="centered">
          <ActivityIndicator />
        </View>
      )}
    </Animated.View>
  );
}

type EASEmptyBranchRowProps = {
  branch: Branch;
  isFirst?: boolean;
  isLast?: boolean;
  navigation: StackNavigationProp<ExtensionsStackParamList>;
};

export function EASEmptyBranchRow({ branch, isFirst, isLast, navigation }: EASEmptyBranchRowProps) {
  const palette = useExpoPalette();

  const { name } = branch;

  function onBranchPress() {
    navigation.navigate('Updates', { branchName: branch.name });
  }

  return (
    <ListButton isFirst={isFirst} isLast={isLast} onPress={onBranchPress}>
      <View>
        <Row align="center">
          <Row
            shrink="1"
            style={{
              backgroundColor: palette.blue['100'],
            }}
            py="tiny"
            px="1.5"
            rounded="medium"
            align="center">
            <BranchIcon
              style={{ maxHeight: 10, maxWidth: 12, resizeMode: 'contain' }}
              resizeMethod="scale"
            />
            <Spacer.Horizontal size="tiny" />
            <View shrink="1">
              <Text size="small" numberOfLines={1}>{`Branch: ${name}`}</Text>
            </View>
          </Row>
          <Spacer.Horizontal />
          <View style={{ paddingLeft: scale.small }}>
            <ChevronRightIcon />
          </View>
        </Row>

        <Spacer.Vertical size="small" />

        <Row>
          <View flex="1" shrink="1">
            <Heading size="small" numberOfLines={1} color="secondary">
              No updates available.
            </Heading>
            <Spacer.Horizontal size="large" />
            <Spacer.Vertical size="tiny" />
          </View>

          <Spacer.Horizontal size="large" />
        </Row>
      </View>
    </ListButton>
  );
}

type EASUpdateRowProps = {
  update: Update;
  isFirst?: boolean;
  isLast?: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

export function EASUpdateRow({ update, isFirst, isLast, isLoading, onPress }: EASUpdateRowProps) {
  const loadingStyle = useLoadingContainerStyle(isLoading);

  return (
    <Animated.View style={loadingStyle}>
      <ListButton disabled={isLoading} isFirst={isFirst} isLast={isLast} onPress={onPress}>
        <View>
          <View style={{ position: 'absolute', right: 0, top: scale.tiny }}>
            <ChevronRightIcon />
          </View>

          <Spacer.Vertical size="small" />

          <Row>
            <View>
              <Spacer.Vertical size="tiny" />
              <UpdateIcon />
            </View>
            <Spacer.Horizontal size="small" />
            <View flex="1" shrink="1">
              <Heading size="small" numberOfLines={1}>
                {`Update "${update.message}"`}
              </Heading>
              <Spacer.Horizontal size="large" />
              <Spacer.Vertical size="tiny" />
              <Text size="small" color="secondary">
                {`Published ${update.createdAt}`}
              </Text>
            </View>

            <Spacer.Horizontal size="large" />
          </Row>
          <Spacer.Vertical size="small" />
        </View>
      </ListButton>

      {isLoading && (
        <View inset="full" align="centered">
          <ActivityIndicator />
        </View>
      )}
    </Animated.View>
  );
}

export function useLoadingContainerStyle(isLoading: boolean = false) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isLoading ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [isLoading]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.7],
  });

  const scaledown = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.975],
  });

  return {
    opacity,
    transform: [{ scale: scaledown }],
  };
}
