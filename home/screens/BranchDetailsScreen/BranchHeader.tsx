import { BranchIcon, iconSize, spacing } from '@expo/styleguide-native';
import { PressableOpacity } from 'components/PressableOpacity';
import { Row, useExpoTheme, View, Text, Spacer } from 'expo-dev-client-components';
import * as React from 'react';
import { Linking } from 'react-native';

import * as UrlUtils from '../../utils/UrlUtils';

type Props = {
  name: string;
  manifestPermalink: string;
};

export function BranchHeader(props: Props) {
  const theme = useExpoTheme();

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
        <PressableOpacity
          onPress={() => {
            Linking.openURL(UrlUtils.toExp(UrlUtils.normalizeUrl(props.manifestPermalink)));
          }}
          borderRadius={4}
          containerProps={{
            style: {
              backgroundColor: theme.button.tertiary.background,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[2],
            },
          }}>
          <Text type="InterSemiBold" style={{ color: theme.button.tertiary.foreground }}>
            Open
          </Text>
        </PressableOpacity>
      </Row>
    </View>
  );
}
