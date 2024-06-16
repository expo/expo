import { spacing } from '@expo/styleguide-native';
import { Heading, Row } from 'expo-dev-client-components';
import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

type Props = {
  header: string;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ header, style }: Props) {
  return (
    <Row px="small" py="small" align="center" style={style}>
      <Heading
        color="secondary"
        size="small"
        style={{ marginRight: spacing[2] }}
        type="InterSemiBold">
        {header}
      </Heading>
    </Row>
  );
}
