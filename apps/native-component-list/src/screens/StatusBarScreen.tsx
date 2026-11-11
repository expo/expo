import { StatusBar, useVerticalBarEdgeIOS } from 'expo-status-bar';
import * as React from 'react';
import { Platform, Text } from 'react-native';

import Button from '../components/Button';
import { Page, Section } from '../components/Page';

export default function StatusBarScreen() {
  const randomAnimation = () => {
    return Math.random() > 0.5 ? 'slide' : 'fade';
  };

  const hide = () => {
    StatusBar.setHidden(true, randomAnimation());
  };

  const show = () => {
    StatusBar.setHidden(false, randomAnimation());
  };

  const verticalBarEdge = useVerticalBarEdgeIOS();

  return (
    <Page>
      <Section title="Toggle" row>
        <Button onPress={hide} title="Hide" />

        <Button onPress={show} title="Show" />
      </Section>

      {Platform.OS === 'ios' && (
        <Section title="Vertical bar">
          <Text testID="vertical-bar-edge">Edge: {verticalBarEdge ?? 'none'}</Text>
        </Section>
      )}

      {Platform.OS === 'ios' && (
        <Section title="Vertical bar behavior" row>
          <Button
            onPress={() => StatusBar.setVerticalBarBehaviorIOS('automatic')}
            title="Automatic"
          />

          <Button
            onPress={() => StatusBar.setVerticalBarBehaviorIOS('disabled')}
            title="Disabled"
          />
        </Section>
      )}
    </Page>
  );
}

StatusBarScreen.navigationOptions = {
  title: 'StatusBar',
};
