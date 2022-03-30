import { borderRadius } from '@expo/styleguide-native';
import { ChevronRightIcon, Row, Spacer, Text, useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';

import { PressableOpacity } from '../../components/PressableOpacity';

type Props = {
  title: string;
  description: string;
  onPress: () => void;
};

export function DiagnosticButton({ title, description, onPress }: Props) {
  const theme = useExpoTheme();

  return (
    <PressableOpacity
      borderRadius={borderRadius.large}
      onPress={onPress}
      containerProps={{ border: 'hairline', bg: 'default', padding: 'medium' }}>
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
    </PressableOpacity>
  );
}
