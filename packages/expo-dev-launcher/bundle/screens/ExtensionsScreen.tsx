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
import { ScrollView } from 'react-native-gesture-handler';

import { ActivityIndicator } from '../components/ActivityIndicator';
import { AppHeader } from '../components/AppHeader';
import { EASBranchRow } from '../components/EASUpdatesRows';
import { EmptyBranchesMessage } from '../components/EmptyBranchesMessage';
import { useUser, useUserActions } from '../providers/UserContextProvider';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { useBranchesForApp } from '../queries/useBranchesForApp';
import { ExtensionsStackParamList } from './ExtensionsStack';

type ExtensionsScreenProps = {
  navigation: StackNavigationProp<ExtensionsStackParamList>;
};

export function ExtensionsScreen({ navigation }: ExtensionsScreenProps) {
  const { isAuthenticated } = useUser();
  const actions = useUserActions();

  const { usesEASUpdates } = useUpdatesConfig();

  function onLoginPress() {
    actions.login('login');
  }

  function onSignupPress() {
    actions.login('signup');
  }

  const compatibleExtensions: string[] = [];

  if (usesEASUpdates) {
    compatibleExtensions.push('EASUpdates');
  }

  return (
    <View>
      <AppHeader navigation={navigation} />
      <ScrollView contentContainerStyle={{ paddingBottom: scale['48'] }}>
        <View flex="1">
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
                    capabilities.
                  </Text>
                </View>

                <Spacer.Vertical size="small" />

                <View align="centered">
                  <Button.ScaleOnPressContainer bg="ghost" rounded="small">
                    <View border="default" px="small" py="2" rounded="small">
                      <Button.Text color="ghost" weight="semibold" size="small">
                        Learn More
                      </Button.Text>
                    </View>
                  </Button.ScaleOnPressContainer>
                </View>
              </View>
            </>
          )}

          {usesEASUpdates && isAuthenticated && (
            <>
              <Spacer.Vertical size="medium" />
              <EASUpdatesPreview navigation={navigation} />
              <Spacer.Vertical size="medium" />
            </>
          )}

          {usesEASUpdates && !isAuthenticated && (
            <>
              <Spacer.Vertical size="medium" />
              <View mx="medium" padding="medium" bg="default" rounded="large">
                <Text color="secondary" size="small">
                  Log in or create an account to get started with Extensions
                </Text>

                <Spacer.Vertical size="large" />

                <View>
                  <Button.ScaleOnPressContainer
                    bg="tertiary"
                    rounded="medium"
                    onPress={onLoginPress}
                    accessibilityLabel="Log in">
                    <View py="small">
                      <Button.Text color="tertiary" weight="semibold" align="center">
                        Log In
                      </Button.Text>
                    </View>
                  </Button.ScaleOnPressContainer>

                  <Spacer.Vertical size="small" />

                  <Button.ScaleOnPressContainer
                    bg="secondary"
                    rounded="medium"
                    onPress={onSignupPress}
                    accessibilityLabel="Sign Up">
                    <View py="small">
                      <Button.Text color="secondary" weight="semibold" align="center">
                        Sign Up
                      </Button.Text>
                    </View>
                  </Button.ScaleOnPressContainer>
                </View>
              </View>
              <Spacer.Vertical size="medium" />
            </>
          )}

          {compatibleExtensions.length > 0 && (
            <>
              <Spacer.Vertical size="medium" />
              <View px="xl">
                <Text size="small" color="secondary">
                  Extensions allow you to customize your development build with additional
                  capabilities.{' '}
                  <Text size="small" color="secondary">
                    Learn more.
                  </Text>
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function EASUpdatesPreview({ navigation }: ExtensionsScreenProps) {
  const { appId } = useUpdatesConfig();
  const { isLoading, data: branches, incompatibleBranches } = useBranchesForApp(appId);

  function onSeeAllBranchesPress() {
    navigation.navigate('Branches');
  }

  function onBranchPress(branchName: string) {
    navigation.navigate('Updates', { branchName });
  }

  if (isLoading) {
    return (
      <View height="44" align="centered" mx="medium" rounded="large" bg="default">
        <ActivityIndicator />
      </View>
    );
  }

  if (branches.length === 0) {
    return (
      <View mx="medium">
        <View px="small">
          <Heading size="small" color="secondary">
            EAS Updates
          </Heading>
        </View>
        <Spacer.Vertical size="small" />
        <EmptyBranchesMessage branches={branches} incompatibleBranches={incompatibleBranches} />
      </View>
    );
  }

  return (
    <View>
      <View mx="medium">
        <View py="small" px="small">
          <Heading size="small" color="secondary">
            EAS Updates
          </Heading>
        </View>
        {branches?.slice(0, 2).map((branch, index) => {
          const isFirst = index === 0;

          return (
            <View key={branch.name}>
              <Button.ScaleOnPressContainer
                bg="default"
                onPress={() => onBranchPress(branch.name)}
                roundedBottom="none"
                roundedTop={isFirst ? 'large' : 'none'}>
                <View
                  bg="default"
                  roundedTop={isFirst ? 'large' : 'none'}
                  roundedBottom="none"
                  py="small"
                  px="small">
                  <EASBranchRow branch={branch} />
                </View>
              </Button.ScaleOnPressContainer>
              <Divider />
            </View>
          );
        })}

        {branches?.length > 0 && (
          <Button.ScaleOnPressContainer
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
          </Button.ScaleOnPressContainer>
        )}
      </View>
    </View>
  );
}
