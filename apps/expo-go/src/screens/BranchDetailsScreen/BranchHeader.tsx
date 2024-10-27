import { BranchIcon, iconSize, spacing } from '@expo/styleguide-native';
import { Row, useExpoTheme, View, Text, Spacer } from 'expo-dev-client-components';
import * as React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { BranchDetailsQuery } from 'src/graphql/types';
import {
  isUpdateCompatibleWithThisExpoGo,
  openUpdateManifestPermalink,
} from 'src/utils/UpdateUtils';

type Props = {
  name: string;
  latestUpdate?: NonNullable<BranchDetailsQuery['app']['byId']['updateBranchByName']>['updates'][0];
};

export function BranchHeader(props: Props) {
  const theme = useExpoTheme();

  const latestUpdate = props.latestUpdate;
  const openButton =
    latestUpdate && isUpdateCompatibleWithThisExpoGo(latestUpdate) ? (
      <TouchableOpacity
        onPress={() => {
          openUpdateManifestPermalink(latestUpdate);
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
