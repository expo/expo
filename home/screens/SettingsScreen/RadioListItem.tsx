import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

type Props = {
  onPress: () => void;
  icon?: ReactNode;
  title: string;
  checked?: boolean;
};

export function RadioListItem({ onPress, icon, title, checked }: Props) {
  const theme = useExpoTheme();

  return (
    <TouchableOpacity onPress={onPress}>
      <Row align="center" justify="between" bg="default" padding="medium">
        <Row align="center">
          {icon}
          {icon ? <Spacer.Horizontal size="small" /> : null}
          <Text size="medium" type="InterRegular">
            {title}
          </Text>
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
    </TouchableOpacity>
  );
}
