import {
  ChevronRightIcon,
  Row,
  Spacer,
  Text,
  useExpoTheme,
  View,
} from 'expo-dev-client-components';
import * as React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

type Props = {
  title: string;
  description: string;
  onPress: () => void;
};

export function DiagnosticButton({ title, description, onPress }: Props) {
  const theme = useExpoTheme();

  return (
    <TouchableOpacity onPress={onPress}>
      <View rounded="large" border="default" bg="default" padding="medium">
        <Row justify="between" align="center">
          <Text
            type="InterSemiBold"
            style={{
              fontSize: 14,
              lineHeight: 14 * 1.5,
            }}>
            {title}
          </Text>
          <ChevronRightIcon size="small" style={{ tintColor: theme.icon.secondary }} />
        </Row>
        <Spacer.Vertical size="tiny" />
        <Text
          style={{ fontSize: 14, lineHeight: 14 * 1.5 }}
          type="InterRegular"
          color="secondary"
          size="small">
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
