import { spacing } from '@expo/styleguide-native';
import { Button, Heading, Row, TerminalIcon, View, Text } from 'expo-dev-client-components';
import * as React from 'react';
import { Platform } from 'react-native';

import DevIndicator from '../../components/DevIndicator';
import { DevSession } from '../../types';

type DevelopmentServersHeaderProps = {
  isNetworkAvailable: boolean;
  projects: DevSession[];
  onHelpPress: () => void;
};

export function DevelopmentServersHeader({
  isNetworkAvailable,
  projects,
  onHelpPress,
}: DevelopmentServersHeaderProps) {
  return (
    <Row px="small" py="small" align="center" justify="between">
      <Row align="center">
        <View style={{ marginRight: spacing[2] }}>
          <TerminalIcon />
        </View>
        <Heading color="secondary" size="small" style={{ marginRight: spacing[2] }}>
          Development servers
        </Heading>
        <DevIndicator
          style={{ marginRight: spacing[2] }}
          isActive={projects && !!projects.length}
          isNetworkAvailable={isNetworkAvailable}
        />
      </Row>
      <Button.Container onPress={onHelpPress}>
        <Text
          color="secondary"
          style={{
            fontSize: 11,
            letterSpacing: 0.92,
            ...Platform.select({
              ios: {
                fontWeight: '500',
              },
            }),
          }}>
          HELP
        </Text>
      </Button.Container>
    </Row>
  );
}
