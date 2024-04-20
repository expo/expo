import { StackNavigationProp } from '@react-navigation/stack';
import {
  Spacer,
  View,
  Text,
  Button,
  Row,
  ChevronRightIcon,
  ExtensionsIcon,
  scale,
  Divider,
  Heading,
} from 'expo-dev-client-components';
import * as React from 'react';
import { Linking, RefreshControl, ScrollView } from 'react-native';

import { ExtensionsStackParamList } from './ExtensionsStack';
import { ActivityIndicator } from '../components/ActivityIndicator';
import { AppHeader } from '../components/AppHeader';
import { EASBranchRow, EASEmptyBranchRow } from '../components/EASUpdatesRows';
import { EmptyBranchesMessage } from '../components/EmptyBranchesMessage';
import { ListButton } from '../components/ListButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { useThrottle } from '../hooks/useDebounce';
import { useOnUpdatePress } from '../hooks/useOnUpdatePress';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { useUser, useUserActions } from '../providers/UserContextProvider';
import { Branch, useBranchesForApp } from '../queries/useBranchesForApp';

type ExtensionsScreenProps = {
  navigation: StackNavigationProp<ExtensionsStackParamList>;
};

export function ExtensionsScreen({ navigation }: ExtensionsScreenProps) {
  const { isAuthenticated } = useUser();
  const actions = useUserActions();
  const { usesEASUpdates, appId } = useUpdatesConfig();
  const {
    isLoading,
    error,
    data: branches,
    emptyBranches,
    incompatibleBranches,
    isRefreshing,
    refetch,
  } = useBranchesForApp(appId, isAuthenticated);

  const throttledRefreshing = useThrottle(isRefreshing, 1000);

  function onLoginPress() {
    actions.login('login');
  }

  function onSignupPress() {
    actions.login('signup');
  }

  const compatibleExtensions: string[] = [];
  const hasError = error != null && !isLoading;

  if (usesEASUpdates && !hasError) {
    compatibleExtensions.push('EASUpdates');
  }

  return (
    <View>
      <AppHeader navigation={navigation} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: scale['48'] }}
        refreshControl={
          appId != null ? (
            <RefreshControl refreshing={throttledRefreshing} onRefresh={() => refetch()} />
          ) : null
        }>
        <ScreenContainer>
          {compatibleExtensions.length === 0 && (
            <>
              <Spacer.Vertical size="medium" />
              <View bg="default" mx="medium" py="medium" px="medium" rounded="medium">
                <View align="centered">
                  <ExtensionsIcon />
                </View>
                <Spacer.Vertical size="medium" />
                <View px="small">
                  <Text size="small" align="center">
                    Extensions allow you to customize your development build with additional
                    capabilities.{' '}
                    <Text
                      size="small"
                      style={{ textDecorationLine: 'underline' }}
                      onPress={() =>
                        Linking.openURL(`https://docs.expo.dev/development/extensions/`)
                      }
                      accessibilityRole="link">
                      Learn more.
                    </Text>
                  </Text>

                  {/* <Spacer.Vertical size="small" />

                  <View align="centered">
                    <Button.FadeOnPressContainer bg="ghost" rounded="small">
                      <View border="default" px="small" py="2" rounded="small">
                        <Button.Text color="ghost" weight="semibold" size="small">
                          Learn More
                        </Button.Text>
                      </View>
                    </Button.FadeOnPressContainer>
                  </View> */}

                  <Spacer.Vertical size="medium" />

                  <Text size="small" align="center">
                    If you would like to extend the display on this screen{' '}
                    <Text
                      size="small"
                      style={{ textDecorationLine: 'underline' }}
                      onPress={() => Linking.openURL(`https://expo.canny.io/feature-requests`)}
                      accessibilityRole="link">
                      let us know about your use case
                    </Text>
                  </Text>
                </View>
              </View>
            </>
          )}

          {usesEASUpdates && isAuthenticated && !hasError && (
            <View>
              <Spacer.Vertical size="medium" />
              <EASUpdatesPreview
                navigation={navigation}
                branches={branches}
                emptyBranches={emptyBranches}
                incompatibleBranches={incompatibleBranches}
              />
              <Spacer.Vertical size="medium" />
            </View>
          )}

          {usesEASUpdates && !isAuthenticated && (
            <View>
              <Spacer.Vertical size="medium" />
              <View mx="medium" padding="medium" bg="default" rounded="large">
                <Text color="secondary" size="small">
                  Log in or create an account to get started with Extensions
                </Text>

                <Spacer.Vertical size="large" />

                <View>
                  <Button.FadeOnPressContainer
                    bg="tertiary"
                    rounded="medium"
                    onPress={onLoginPress}
                    accessibilityLabel="Log in">
                    <View py="small">
                      <Button.Text color="tertiary" weight="semibold" align="center">
                        Log In
                      </Button.Text>
                    </View>
                  </Button.FadeOnPressContainer>

                  <Spacer.Vertical size="small" />

                  <Button.FadeOnPressContainer
                    bg="secondary"
                    rounded="medium"
                    onPress={onSignupPress}
                    accessibilityLabel="Sign Up">
                    <View py="small">
                      <Button.Text color="secondary" weight="semibold" align="center">
                        Sign Up
                      </Button.Text>
                    </View>
                  </Button.FadeOnPressContainer>
                </View>
              </View>
              <Spacer.Vertical size="medium" />
            </View>
          )}

          {compatibleExtensions.length > 0 && (
            <View px="xl">
              <Text size="small" color="secondary">
                Extensions allow you to customize your development build with additional
                capabilities.{' '}
                <Text
                  size="small"
                  style={{ textDecorationLine: 'underline' }}
                  onPress={() => Linking.openURL(`https://docs.expo.dev/development/extensions/`)}
                  accessibilityRole="link">
                  Learn more.
                </Text>
              </Text>
            </View>
          )}

          {isLoading && isAuthenticated && (
            <View
              mt="medium"
              inset="full"
              align="centered"
              mx="medium"
              rounded="large"
              bg="default">
              <ActivityIndicator />
            </View>
          )}
        </ScreenContainer>
      </ScrollView>
    </View>
  );
}

type EASUpdatesPreviewProps = ExtensionsScreenProps & {
  branches: Branch[];
  emptyBranches: Branch[];
  incompatibleBranches: Branch[];
};

function EASUpdatesPreview({
  navigation,
  branches,
  emptyBranches,
  incompatibleBranches,
}: EASUpdatesPreviewProps) {
  const { loadingUpdateId, onUpdatePress } = useOnUpdatePress();

  function onSeeAllBranchesPress() {
    navigation.navigate('Branches');
  }

  const branchCount = branches.length + emptyBranches.length;

  // only empty branches (which technically are compatible)
  if (branches.length === 0 && emptyBranches.length > 0) {
    return (
      <View mx="medium">
        <View py="small" px="small">
          <Heading size="small" color="secondary">
            EAS Update
          </Heading>
        </View>

        {emptyBranches.slice(0, 3).map((branch, index, arr) => {
          const isFirst = index === 0;
          const isLast = index === arr?.length - 1;

          return (
            <View key={branch.id}>
              <EASEmptyBranchRow
                branch={branch}
                isFirst={isFirst}
                isLast={isLast}
                navigation={navigation}
              />
              {!isLast && <Divider />}
            </View>
          );
        })}
        {emptyBranches.length > 1 && (
          <Button.FadeOnPressContainer
            onPress={onSeeAllBranchesPress}
            bg="default"
            roundedTop="none"
            roundedBottom="large">
            <View bg="default" py="small" px="small" roundedTop="none" roundedBottom="large">
              <Row>
                <Text size="medium">See all branches</Text>
                <Spacer.Horizontal />
                <ChevronRightIcon />
              </Row>
            </View>
          </Button.FadeOnPressContainer>
        )}
      </View>
    );
  }

  // no compatible branches
  if (branches.length === 0) {
    return (
      <View mx="medium">
        <View px="small">
          <Heading size="small" color="secondary">
            EAS Update
          </Heading>
        </View>
        <Spacer.Vertical size="small" />
        <EmptyBranchesMessage branches={branches} incompatibleBranches={incompatibleBranches} />
      </View>
    );
  }

  // some compatible branches, possible some empty branches
  return (
    <View mx="medium">
      <View py="small" px="small">
        <Heading size="small" color="secondary">
          EAS Update
        </Heading>
      </View>
      {branches?.slice(0, 2).map((branch, index, arr) => {
        const isFirst = index === 0;
        const isLast = index === arr.length - 1 && branchCount <= 1;
        const isLoading = branch.updates[0]?.id === loadingUpdateId;

        return (
          <View key={branch.name}>
            <EASBranchRow
              branch={branch}
              isFirst={isFirst}
              isLast={isLast}
              navigation={navigation}
              isLoading={isLoading}
              onUpdatePress={onUpdatePress}
            />
            <Divider />
          </View>
        );
      })}

      {branchCount > 1 && (
        <ListButton onPress={onSeeAllBranchesPress} isLast>
          <Row>
            <Text size="medium">See all branches</Text>
            <Spacer.Horizontal />
            <ChevronRightIcon />
          </Row>
        </ListButton>
      )}
    </View>
  );
}
