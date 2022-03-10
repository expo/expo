import { spacing } from '@expo/styleguide-native';
import { Heading, Row } from 'expo-dev-client-components';
import * as React from 'react';
import { Platform } from 'react-native';

export function ProjectsHeader() {
  return (
    <Row px="small" py="small" align="center" justify="between">
      <Heading
        color="secondary"
        size="small"
        style={{ marginRight: spacing[2], fontWeight: Platform.OS === 'ios' ? '600' : 'bold' }}>
        Projects
      </Heading>
    </Row>
  );
}
