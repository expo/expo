import { Text, Row } from 'expo-dev-client-components';
import * as React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

type Props = {
  title: string;
  value: string;
  onPress?: () => void;
};

export function ConstantItem({ title, value, onPress }: Props) {
  return (
    <TouchableOpacity disabled={!onPress} onPress={onPress}>
      <Row justify="between" align="center" padding="medium">
        <Text type="InterRegular">{title}</Text>
        <Text type="InterRegular">{value}</Text>
      </Row>
    </TouchableOpacity>
  );
}
