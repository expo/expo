import {
  Button,
  Image,
  Heading,
  Text,
  Row,
  Spacer,
  View,
  Divider,
  CheckIcon,
  XIcon,
} from 'expo-dev-client-components';
import * as React from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoutConfirmationModal } from '../components/redesign/LogoutConfirmationModal';
import { UserAccount, UserData } from '../functions/getUserProfileAsync';
import { useModalStack } from '../hooks/useModalStack';
import { useUser, useUserActions } from '../hooks/useUser';

export function UserProfileScreen({ navigation }) {
  const { userData, selectedAccount } = useUser();
  const modalStack = useModalStack();
  const actions = useUserActions();
  const [isLoading, setIsLoading] = React.useState(false);

  const onLoginPress = async () => {
    setIsLoading(true);
    await actions.login('login');
    setIsLoading(false);
  };

  const onSignupPress = async () => {
    setIsLoading(true);
    await actions.login('signup');
    setIsLoading(false);
  };

  const onSelectAccount = (account: UserAccount) => {
    actions.setSelectedAccount(account.id);
  };

  const onLogoutPress = () => {
    modalStack.push({
      title: 'Confirm logout?',
      element: (
        <LogoutConfirmationModal
          onClosePress={() => modalStack.pop()}
          onLogoutPress={() => {
            actions.logout();
            modalStack.pop();
          }}
        />
      ),
    });
  };

  const onClosePress = () => {
    navigation.goBack();
  };

  const isAuthenticated = userData != null;

  return (
    <SafeAreaView>
      <View>
        <View>
          <AccountScreenHeader onClosePress={onClosePress} />

          <Spacer.Vertical size="medium" />

          <View px="medium">
            {isAuthenticated ? (
              <UserAccountSelector
                userData={userData}
                selectedAccount={selectedAccount}
                onSelectAccount={onSelectAccount}
                onLogoutPress={onLogoutPress}
              />
            ) : (
              <LoginSignupCard
                isLoading={isLoading}
                onLoginPress={onLoginPress}
                onSignupPress={onSignupPress}
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function AccountScreenHeader({ onClosePress }) {
  return (
    <View>
      <Spacer.Vertical size="small" />
      <Row align="center">
        <View px="medium">
          <Heading size="medium">Account</Heading>
        </View>

        <Spacer.Horizontal size="flex" />

        <Button.ScaleOnPressContainer
          onPress={onClosePress}
          accessibilityLabel="Go Back"
          rounded="full"
          bg="ghost"
          minScale={0.9}>
          <View padding="medium" rounded="full">
            <XIcon />
          </View>
        </Button.ScaleOnPressContainer>
      </Row>
    </View>
  );
}

function LoginSignupCard({ onLoginPress, onSignupPress, isLoading }) {
  return (
    <View px="small" py="medium" bg="default" rounded="large">
      <Text color="secondary" size="small" leading="large">
        Log in or create an account to view local development servers and more.
      </Text>

      <Spacer.Vertical size="medium" />

      <Button.ScaleOnPressContainer
        bg="tertiary"
        rounded="medium"
        onPress={onLoginPress}
        disabled={isLoading}
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
        disabled={isLoading}
        accessibilityLabel="Sign up">
        <View py="small">
          <Button.Text color="secondary" weight="semibold" align="center">
            Sign up
          </Button.Text>
        </View>
      </Button.ScaleOnPressContainer>

      {isLoading && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            left: 0,
            top: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </View>
  );
}

type UserAccountSelectorProps = {
  userData: UserData;
  selectedAccount: UserAccount;
  onSelectAccount: (userAccount: UserAccount) => void;
  onLogoutPress: () => void;
};

function UserAccountSelector({
  userData,
  selectedAccount,
  onSelectAccount,
  onLogoutPress,
}: UserAccountSelectorProps) {
  return (
    <View>
      <View>
        {userData.accounts
          .filter((account) => account && account.owner)
          .map((account, index, arr) => {
            const isLast = index === arr.length - 1;
            const isFirst = index === 0;
            const isSelected = account.id === selectedAccount?.id;

            return (
              <Button.ScaleOnPressContainer
                key={account.id}
                onPress={() => onSelectAccount(account)}
                bg="default"
                roundedBottom={isLast ? 'large' : 'none'}
                roundedTop={isFirst ? 'large' : 'none'}>
                <Row align="center" py="small" px="medium">
                  <Image size="large" rounded="full" source={{ uri: account.owner.profilePhoto }} />
                  <Spacer.Horizontal size="small" />

                  <View>
                    <Heading size="small">{account.owner.username}</Heading>
                  </View>

                  <Spacer.Vertical size="flex" />
                  {isSelected && <CheckIcon testID={`active-account-checkmark-${account.id}`} />}
                </Row>
                {!isLast && <Divider />}
              </Button.ScaleOnPressContainer>
            );
          })}
      </View>

      <Spacer.Vertical size="medium" />

      <Button.ScaleOnPressContainer bg="tertiary" rounded="medium" onPress={onLogoutPress}>
        <View py="small" rounded="medium">
          <Button.Text color="tertiary" weight="bold" align="center">
            Log Out
          </Button.Text>
        </View>
      </Button.ScaleOnPressContainer>
    </View>
  );
}
