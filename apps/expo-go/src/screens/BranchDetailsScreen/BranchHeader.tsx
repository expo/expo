import { BranchIcon, iconSize, spacing } from '@expo/styleguide-native';
import { Row, useExpoTheme, View, Text, Spacer } from 'expo-dev-client-components';
import * as React from 'react';
import { Linking } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { BranchDetailsQuery } from 'src/graphql/types';

import * as Kernel from '../../kernel/Kernel';
import * as UrlUtils from '../../utils/UrlUtils';

type Props = {
  name: string;
  latestUpdate?: NonNullable<BranchDetailsQuery['app']['byId']['updateBranchByName']>['updates'][0];
};

export function BranchHeader(props: Props) {
  const theme = useExpoTheme();

  const latestUpdate = props.latestUpdate;
  const openButton =
    latestUpdate &&
    latestUpdate.expoGoSDKVersion &&
    Kernel.sdkVersionsArray.includes(latestUpdate.expoGoSDKVersion) ? (
      <TouchableOpacity
        onPress={() => {
          Linking.openURL(UrlUtils.toExp(UrlUtils.normalizeUrl(latestUpdate.manifestPermalink)));
        }}
        style={{
          backgroundColor: theme.button.tertiary.background,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[2],
          borderRadius: 4,
        }}>
        <Text type="InterSemiBold" style={{ color: theme.button.tertiary.foreground }}>
          Open
        </Text>
      </TouchableOpacity>
    ) : null;

  return (
    <View
      bg="default"
      padding="medium"
      style={{
        borderColor: theme.border.default,
        borderBottomWidth: 1,
      }}>
      <Row align="center" justify="between">
        <Row align="center">
          <BranchIcon color={theme.icon.default} size={iconSize.large} />
          <Spacer.Horizontal size="tiny" />
          <Text size="large" type="InterSemiBold">
            {props.name}
          </Text>
        </Row>
        {openButton}
      </Row>
    </View>
  );
}
