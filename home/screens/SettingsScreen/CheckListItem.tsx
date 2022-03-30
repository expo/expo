import { CheckIcon, iconSize } from '@expo/styleguide-native';
import { Row, Spacer, Text, useExpoTheme } from 'expo-dev-client-components';
import React, { ReactNode } from 'react';

import { PressableOpacity } from '../../components/PressableOpacity';

type Props = {
  onPress: () => void;
  icon?: ReactNode;
  title: string;
  checked?: boolean;
};

export function CheckListItem({ onPress, icon, title, checked }: Props) {
  const theme = useExpoTheme();

  return (
    <PressableOpacity onPress={onPress} containerProps={{ bg: 'default' }}>
      <Row align="center" justify="between" padding="medium">
        <Row align="center">
          {icon}
          {icon ? <Spacer.Horizontal size="small" /> : null}
          <Text size="medium" type="InterRegular">
            {title}
          </Text>
        </Row>
        {checked ? <CheckIcon size={iconSize.regular} color={theme.icon.default} /> : null}
      </Row>
    </PressableOpacity>
  );
}
