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

import { UserAccount, UserData } from '../functions/getUserProfileAsync';
import { useUser, useUserActions } from '../hooks/useUser';

export function UserProfileScreen({ navigation }) {
  const { userData, selectedAccount } = useUser();
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
    actions.logout();
  };

  const onClosePress = () => {
    navigation.goBack();
  };

  const isAuthenticated = userData != null;

  return (
    <SafeAreaView>
      <View py="tiny">
        <View padding="medium">
          <AccountScreenHeader onClosePress={onClosePress} />

          <Spacer.Vertical size="medium" />

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
    </SafeAreaView>
  );
}

function AccountScreenHeader({ onClosePress }) {
  return (
    <Row>
      <Heading size="medium">Account</Heading>
      <Spacer.Horizontal size="flex" />
      <Button onPress={onClosePress} accessibilityLabel="Go Back">
        <XIcon />
      </Button>
    </Row>
  );
}

function LoginSignupCard({ onLoginPress, onSignupPress, isLoading }) {
  return (
    <View px="small" py="medium" bg="default" rounded="large">
      <Text color="secondary" size="small" leading="large">
        Log in or create an account to view local development servers and more.
      </Text>

      <Spacer.Vertical size="medium" />

      <Button
        bg="tertiary"
        py="small"
        rounded="medium"
        onPress={onLoginPress}
        disabled={isLoading}
        accessibilityLabel="Log in">
        <Text button="tertiary" weight="semibold" align="center">
          Log In
        </Text>
      </Button>

      <Spacer.Vertical size="small" />

      <Button
        bg="secondary"
        py="small"
        rounded="medium"
        onPress={onSignupPress}
        disabled={isLoading}
        accessibilityLabel="Sign up">
        <Text button="secondary" weight="semibold" align="center">
          Sign up
        </Text>
      </Button>

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
      <View bg="default" rounded="large">
        {userData.accounts.map((account, index, arr) => {
          const isLast = index === arr.length - 1;
          const isSelected = account.id === selectedAccount?.id;

          return (
            <Button key={account.id} onPress={() => onSelectAccount(account)}>
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
            </Button>
          );
        })}
      </View>

      <Spacer.Vertical size="medium" />

      <Button bg="tertiary" py="small" rounded="medium" onPress={onLogoutPress}>
        <Text button="tertiary" weight="semibold" align="center">
          Log Out
        </Text>
      </Button>
    </View>
  );
}
