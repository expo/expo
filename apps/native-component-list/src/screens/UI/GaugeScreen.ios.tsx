import { Gauge, Host, VStack } from '@expo/ui/swift-ui';
import * as React from 'react';
import { PlatformColor } from 'react-native';

import { Page, Section } from '../../components/Page';

const COLORS = [
  PlatformColor('systemGreen'),
  PlatformColor('systemYellow'),
  PlatformColor('systemRed'),
];

export default function GaugeScreen() {
  return (
    <Page>
      <Section title="Default">
        <Host matchContents>
          <VStack spacing={16}>
            <Gauge label="label" current={{ value: 0.2 }} />
            <Gauge
              label="Usage"
              current={{ value: 70, label: '70%', color: PlatformColor('systemYellow') }}
              min={{ value: 0, label: '0', color: PlatformColor('systemGreen') }}
              max={{ value: 100, label: '100', color: PlatformColor('systemRed') }}
              color={COLORS}
            />
          </VStack>
        </Host>
      </Section>
      <Section title="Circular">
        <Host matchContents>
          <VStack spacing={16}>
            <Gauge current={{ value: 0.2, label: '20%' }} color={COLORS} type="circular" />
            <Gauge
              current={{ value: 0.7, label: '70%' }}
              color={[...COLORS].reverse()}
              type="circularCapacity"
            />
          </VStack>
        </Host>
      </Section>
      <Section title="Linear">
        <Host matchContents>
          <VStack spacing={16}>
            <Gauge
              label="linear label"
              current={{ value: 0.2, label: '20%' }}
              color={COLORS}
              type="linear"
            />
            <Gauge
              label="linearCapacity label"
              current={{ value: 0.7, label: '70%' }}
              color={COLORS}
              type="linearCapacity"
            />
          </VStack>
        </Host>
      </Section>
    </Page>
  );
}

GaugeScreen.navigationOptions = {
  title: 'Gauge',
};
