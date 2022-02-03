import { RouteProp } from '@react-navigation/native';
import * as React from 'react';
import { View, SafeAreaView, StyleSheet, ScrollView } from 'react-native';

import { getByStoryId } from '../getStories';
import { styles } from '../styles';
import { RootStackParamList, StoriesExport } from '../types';

type SelectedStoriesDetailProps = {
  route: RouteProp<RootStackParamList, 'Stories Detail'>;
};

// this is resolved via customization (extraNodeModules) in metro-config / webpack-config
// duplication is required as wrapping the require in a function breaks fast refresh
const stories: StoriesExport = require('generated-expo-stories');
const storiesById = getByStoryId(stories);

export function SelectedStoriesDetail({ route }: SelectedStoriesDetailProps) {
  const { selectedStoryIds = [] } = route.params || {};
  const selectedStories = selectedStoryIds.map(storyId => storiesById[storyId]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <SafeAreaView style={styles.flexContainer}>
        <ScrollView style={styles.flexContainer}>
          {selectedStories.map(story => {
            return (
              <View key={`${story.id}`} style={styles.storyRow}>
                {React.createElement(story.component)}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
