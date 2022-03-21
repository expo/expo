import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React, { ReactNode } from 'react';

import { PressableOpacity } from '../../components/PressableOpacity';

type Props = {
  onPress: () => void;
  icon?: ReactNode;
  title: string;
  checked?: boolean;
};

export function RadioListItem({ onPress, icon, title, checked }: Props) {
  const theme = useExpoTheme();

  return (
    <PressableOpacity onPress={onPress} containerProps={{ bg: 'default' }}>
      <Row align="center" justify="between" padding="medium">
        <Row align="center">
          {icon}
          {icon ? <Spacer.Horizontal size="small" /> : null}
          <Text size="medium">{title}</Text>
        </Row>
        <View
          style={{
            height: 20,
            width: 20,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.icon.secondary,
          }}
          align="centered">
          {checked ? (
            <View
              style={{
                height: 12,
                width: 12,
                borderRadius: 10,
                backgroundColor: theme.icon.default,
              }}
            />
          ) : null}
        </View>
      </Row>
    </PressableOpacity>
  );
}
