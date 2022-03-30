import { ViewStyle } from '@expo/html-elements/build/primitives/View';
import { spacing } from '@expo/styleguide-native';
import { Heading, Row } from 'expo-dev-client-components';
import * as React from 'react';

type Props = {
  header: string;
  style?: ViewStyle;
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
