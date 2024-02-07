import {
  Button,
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
import { ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { LogoutConfirmationModal } from '../components/LogoutConfirmationModal';
import { UserAccount, UserData } from '../functions/getUserProfileAsync';
import { useModalStack } from '../providers/ModalStackProvider';
import { useUser, useUserActions } from '../providers/UserContextProvider';

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
    modalStack.push(() => (
      <LogoutConfirmationModal
        onClosePress={() => modalStack.pop()}
        onLogoutPress={async () => {
          await actions.logout();
          modalStack.pop();
        }}
      />
    ));
  };

  const onClosePress = () => {
    navigation.goBack();
  };

  const isAuthenticated = userData != null;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

function AccountScreenHeader({ onClosePress }) {
  return (
    <View>
      <Spacer.Vertical size="small" />
      <Row align="center">
        <View px="medium">
          <Heading size="large">Account</Heading>
        </View>

        <Spacer.Horizontal />

        <Button.FadeOnPressContainer
          onPress={onClosePress}
          accessibilityLabel="Go Back"
          rounded="full"
          bg="ghost">
          <View padding="medium" rounded="full">
            <XIcon />
          </View>
        </Button.FadeOnPressContainer>
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

      <Button.FadeOnPressContainer
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
      </Button.FadeOnPressContainer>

      <Spacer.Vertical size="small" />

      <Button.FadeOnPressContainer
        bg="secondary"
        rounded="medium"
        onPress={onSignupPress}
        disabled={isLoading}
        accessibilityLabel="Sign Up">
        <View py="small">
          <Button.Text color="secondary" weight="semibold" align="center">
            Sign Up
          </Button.Text>
        </View>
      </Button.FadeOnPressContainer>

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
  const accounts: UserAccount[] = [];
  const orgs: UserAccount[] = [];

  for (const account of userData.accounts) {
    if (account) {
      if (account.ownerUserActor) {
        accounts.push(account);
      } else {
        orgs.push(account);
      }
    }
  }

  const accountsSortedByType: UserAccount[] = [...accounts, ...orgs];

  return (
    <View>
      <View>
        {accountsSortedByType.map((account, index, arr) => {
          const isLast = index === arr.length - 1;
          const isFirst = index === 0;
          const isSelected = account.id === selectedAccount?.id;

          return (
            <Button.FadeOnPressContainer
              key={account.id}
              onPress={() => onSelectAccount(account)}
              bg="default"
              roundedBottom={isLast ? 'large' : 'none'}
              roundedTop={isFirst ? 'large' : 'none'}>
              <Row align="center" py="small" px="medium" bg="default">
                <Avatar
                  profilePhoto={account?.ownerUserActor?.profilePhoto}
                  name={
                    account?.ownerUserActor?.fullName
                      ? account.ownerUserActor.fullName
                      : account?.name
                  }
                  isOrganization={account?.ownerUserActor === null}
                  size="large"
                />
                <Spacer.Horizontal size="small" />

                <View>
                  <Heading>{account.ownerUserActor?.username ?? account.name}</Heading>
                </View>

                <Spacer.Vertical />
                {isSelected && <CheckIcon testID={`active-account-checkmark-${account.id}`} />}
              </Row>
              {!isLast && <Divider />}
            </Button.FadeOnPressContainer>
          );
        })}
      </View>

      <Spacer.Vertical size="medium" />

      <Button.FadeOnPressContainer bg="tertiary" rounded="medium" onPress={onLogoutPress}>
        <View py="small" rounded="medium">
          <Button.Text color="tertiary" weight="bold" align="center">
            Log Out
          </Button.Text>
        </View>
      </Button.FadeOnPressContainer>
    </View>
  );
}
