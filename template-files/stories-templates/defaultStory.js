import { Container } from 'expo-stories/components';
import * as React from 'react';
import { Text } from 'react-native';

export const DefaultStory = () => (
  <Container labelTop="My Story">
    <Text>Add your stories here!</Text>
  </Container>
);

MyDefaultStory.storyConfig = {
  name: 'My Name',
};

export default {
  title: 'Stories',
};
