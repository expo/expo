import { Container } from 'expo-stories/components';
import * as React from 'react';
import { Text } from 'react-native';

export const MyDefaultStory = () => (
  <Container labelTop="Default Story">
    <Text>Add your stories here!</Text>
  </Container>
);

MyDefaultStory.storyConfig = {
  name: 'My Default Story Name',
};

export default {
  title: 'Default story title',
};
