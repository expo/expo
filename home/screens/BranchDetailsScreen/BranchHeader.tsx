import { BranchIcon, iconSize, spacing } from '@expo/styleguide-native';
import { Row, useExpoTheme, View, Text, Spacer } from 'expo-dev-client-components';
import * as React from 'react';
import { Linking } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import * as UrlUtils from '../../utils/UrlUtils';

type Props = {
  name: string;
  manifestPermalink?: string;
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
        {props.manifestPermalink && (
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(UrlUtils.toExp(UrlUtils.normalizeUrl(props.manifestPermalink!)));
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
        )}
      </Row>
    </View>
  );
}
