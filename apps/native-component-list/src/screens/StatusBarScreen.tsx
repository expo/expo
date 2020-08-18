import * as React from 'react';
import { StatusBar } from 'react-native';

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

  return (
    <Page>
      <Section title="Toggle" row>
        <Button onPress={hide} title="Hide" />

        <Button onPress={show} title="Show" />
      </Section>
    </Page>
  );
}

StatusBarScreen.navigationOptions = {
  title: 'StatusBar',
};
