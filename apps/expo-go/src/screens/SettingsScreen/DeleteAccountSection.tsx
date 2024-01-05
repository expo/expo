import { TrashIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React from 'react';

import { Button } from '../../components/Button';
import { SectionHeader } from '../../components/SectionHeader';
import { SettingsStackRoutes } from '../../navigation/Navigation.types';

type Props = {
  viewerUsername: string;
};

export function DeleteAccountSection(props: Props) {
  const { viewerUsername } = props;

  const navigation = useNavigation<StackNavigationProp<SettingsStackRoutes>>();
  const theme = useExpoTheme();

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
          <Row justify="end">
            <Button
              label="Delete Account"
              theme="error"
              onPress={() => navigation.navigate('DeleteAccount', { viewerUsername })}
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
