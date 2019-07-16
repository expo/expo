import { object } from '@storybook/addon-knobs/react';
import * as ErrorRecovery from 'expo/build/ErrorRecovery/ErrorRecovery';
import React from 'react';
import { View } from 'react-native';
import { Description, Section, DocItem } from '../ui-explorer';

export const title = 'Error Recovery';
export const label = 'ErrorRecovery';

export const description =
  'Utilities for helping you gracefully handle crashes due to fatal JavaScript errors.';
export const packageJson = require('expo/package.json');
export const component = () => {
  ErrorRecovery.setRecoveryProps(object('Recovery', {}));
  return (
    <Section>
      <DocItem
        name="setRecoveryProps"
        typeInfo="props: Object"
        description="Set arbitrary error recovery props. If your project crashes in production as a result of a fatal JS error, Expo will reload your project. If you've set these props, they'll be passed to your reloaded project's initial props under exp.errorRecovery."
        example={{
          render: () => (
            <View style={{ flexDirection: 'row', flex: 1 }}>
              <Description>Inner app content</Description>
            </View>
          ),
        }}
      />
    </Section>
  );
};
