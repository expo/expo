import { spacing } from '@expo/styleguide-native';
import { Heading, Row, Text } from 'expo-dev-client-components';
import * as React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

type Props = {
  onClearPress: () => void;
};

export function RecentlyOpenedHeader({ onClearPress }: Props) {
  return (
    <Row px="small" py="small" align="center" justify="between">
      <Heading
        color="secondary"
        size="small"
        style={{ marginRight: spacing[2] }}
        type="InterSemiBold">
        Recently opened
      </Heading>
      <TouchableOpacity onPress={onClearPress}>
        <Text
          type="InterSemiBold"
          color="secondary"
          style={{
            fontSize: 11,
            letterSpacing: 0.92,
          }}>
          CLEAR
        </Text>
      </TouchableOpacity>
    </Row>
  );
}
