import { TrashIcon } from '@expo/styleguide-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';

import Config from '../../api/Config';
import { Button } from '../../components/Button';
import { SectionHeader } from '../../components/SectionHeader';
import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { useDispatch } from '../../redux/Hooks';
import SessionActions from '../../redux/SessionActions';
import { useAccountName } from '../../utils/AccountNameContext';

export function DeleteAccountSection() {
  const theme = useExpoTheme();
  const { setAccountName } = useAccountName();
  const dispatch = useDispatch();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const navigation = useNavigation<NavigationProp<HomeStackRoutes>>();
  const [deletionError, setDeletionError] = React.useState<string | null>(null);
  const mounted = React.useRef<boolean | null>(true);

  const _handleDeleteAccount = async () => {
    if (isDeleting) {
      return;
    }
    setDeletionError(null);
    setIsDeleting(true);

    try {
      const redirectBase = 'expauth://after-delete';
      const authSessionURL = `${
        Config.website.origin
      }/settings/delete-user-expo-go?post_delete_redirect_uri=${encodeURIComponent(redirectBase)}`;
      const result = await WebBrowser.openAuthSessionAsync(authSessionURL, redirectBase, {
        /** note(brentvatne): We should disable the showInRecents option when
         * https://github.com/expo/expo/issues/8072 is resolved. This workaround
         * prevents the Chrome Custom Tabs activity from closing when the user
         * switches from the login / sign up form to a password manager or 2fa
         * app. The downside of using this flag is that the browser window will
         * remain open in the background after authentication completes. */
        showInRecents: true,
      });

      if (!mounted.current) {
        return;
      }

      if (result.type === 'success') {
        setAccountName(undefined);
        dispatch(SessionActions.signOut());
        navigation.navigate('Home');
      }
    } catch (e) {
      // TODO(wschurman): Put this into Sentry
      console.error({ e });
      setDeletionError(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View>
      <SectionHeader header="Delete Account" />
      <View>
        <View bg="default" padding="medium" rounded="large" border="default">
          <Row align="center">
            <TrashIcon color={theme.icon.default} />
            <Spacer.Horizontal size="small" />
            <Text type="InterSemiBold" size="large">
              Delete your account
            </Text>
          </Row>
          <Spacer.Vertical size="small" />
          <Text type="InterRegular" color="secondary" size="medium">
            This action is irreversible. It will delete your personal account, projects, and
            activity.
          </Text>
          <Spacer.Vertical size="small" />
          {deletionError ? (
            <>
              <View bg="error" padding="medium" rounded="medium" border="error">
                <Text>{deletionError}</Text>
              </View>
              <Spacer.Vertical size="small" />
            </>
          ) : null}
          <Row justify="end">
            <Button
              label="Delete Account"
              theme="error"
              onPress={_handleDeleteAccount}
              style={{
                alignSelf: 'flex-start',
              }}
            />
          </Row>
        </View>
      </View>
    </View>
  );
}
