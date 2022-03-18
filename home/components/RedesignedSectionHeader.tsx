import { spacing } from '@expo/styleguide-native';
import { Heading, Row } from 'expo-dev-client-components';
import * as React from 'react';

type Props = {
  header: string;
};

export function RedesignedSectionHeader({ header }: Props) {
  return (
    <Row px="small" py="small" align="center" justify="between">
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
