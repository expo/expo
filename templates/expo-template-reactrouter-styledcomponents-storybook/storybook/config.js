import React from 'react';
import { SafeAreaView } from 'react-native';
import { configure, addDecorator } from '@storybook/react-native';
import { loadStories } from './storyLoader';

configure(loadStories, module);

addDecorator(story => (
  <SafeAreaView>
    {story()}
  </SafeAreaView>
));
