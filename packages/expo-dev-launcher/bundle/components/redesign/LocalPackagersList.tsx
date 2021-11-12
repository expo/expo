import { ChevronDownIcon } from '@expo/styleguide-native';
import * as React from 'react';

import { Packager } from '../../functions/getLocalPackagersAsync';
import { Button } from './Button';
import { Text } from './Text';
import { Divider, Row, Spacer, StatusIndicator, View } from './View';

type LocalPackagersListProps = {
  packagers?: Packager[];
  onPackagerPress: (packager: Packager) => void;
};

export function LocalPackagersList({ packagers = [], onPackagerPress }: LocalPackagersListProps) {
  if (packagers.length === 0) {
    return null;
  }

  return (
    <View>
      {packagers.map((packager) => {
        return (
          <View key={packager.description}>
            <Button onPress={() => onPackagerPress(packager)}>
              <Row align="center" padding="medium">
                <StatusIndicator size="small" status="success" />
                <Spacer.Horizontal size="small" />
                <Text>{packager.description}</Text>
                <Spacer.Horizontal size="flex" />
                <ChevronDownIcon style={{ transform: [{ rotate: '-90deg' }] }} />
              </Row>
            </Button>
            <Divider />
          </View>
        );
      })}
    </View>
  );
}
