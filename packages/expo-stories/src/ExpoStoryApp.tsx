import { lightTheme, shadows, spacing } from '@expo/styleguide-native';
import * as React from 'react';
import { View, SafeAreaView, Pressable, Text, StyleSheet, ScrollView } from 'react-native';

import { ExpoStoryLoader } from './ExpoStoryLoader';
import { Stack, StackContainer } from './async-stack';

// this is resolved via customization (extraNodeModules) in metro-config / webpack-config
const stories = require('generated-expo-stories');

// aggregate stories
const storyData = {};

Object.keys(stories).forEach(key => {
  const story = stories[key];
  const storyConfig = story.storyConfig;
  const parentConfig = story.parentConfig;

  if (!storyData[parentConfig.id]) {
    storyData[parentConfig.id] = {
      ...parentConfig,
      stories: [],
    };
  }

  storyData[parentConfig.id].stories.push(storyConfig);
});

export default function App() {
  return (
    <StackContainer>
      <ExpoStoryApp />
    </StackContainer>
  );
}

function ExpoStoryApp() {
  const parentStories: any[] = [];

  Object.keys(storyData).forEach(key => {
    const parentStory: any = storyData[key];
    parentStories.push(parentStory);
  });

  return (
    <SafeAreaView style={styles.flexContainer}>
      <View style={styles.flexContainer}>
        <Text style={styles.storyTitle}>Expo Story Loader</Text>

        <ScrollView style={styles.storyButtonsContainer}>
          {parentStories.map((story: any) => {
            return (
              <StoryButton
                key={story.id}
                title={story.title}
                onPress={() => {
                  Stack.push({
                    element: <StoriesScreen parentStoryId={story.id} />,
                    headerProps: { title: story.title },
                  });
                }}
              />
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function StoriesScreen({ parentStoryId }) {
  const parentStories: any = [];

  Object.keys(storyData).forEach(key => {
    if (key === parentStoryId) {
      parentStories.push(storyData[key]);
    }
  });

  return (
    <SafeAreaView style={styles.flexContainer}>
      <ScrollView style={styles.flexContainer}>
        {parentStories.map(story => {
          return (
            <View key={story.id}>
              {story.stories.map(s => {
                return (
                  <StoryButton
                    key={s.id}
                    title={s.name}
                    onPress={() => {
                      Stack.push({
                        element: <ExpoStoryLoader selectedStoryId={s.id} />,
                        headerProps: { title: s.name },
                      });
                    }}
                  />
                );
              })}
              {story.stories.length > 1 && (
                <StoryButton
                  title="See All"
                  color={lightTheme.button.tertiary.background}
                  onPress={() => {
                    Stack.push({
                      element: <ExpoStoryLoader selectedStoryId={story.id} displayStoryTitle />,
                      headerProps: { title: `${story.title} Stories` },
                    });
                  }}
                />
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function StoryButton({ title, color = lightTheme.button.primary.background, onPress }) {
  return (
    // @ts-ignore
    <Pressable style={[styles.storyButton, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.storyButtonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: lightTheme.background.default,
    padding: spacing[3],
  },
  storyTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  storyButtonsContainer: {
    padding: spacing[4],
    backgroundColor: lightTheme.background.default,
  },
  storyButton: {
    borderRadius: 4,
    paddingVertical: spacing[4],
    marginVertical: spacing[2],
    backgroundColor: lightTheme.button.primary.background,
    ...shadows.button,
  },
  storyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: lightTheme.button.primary.foreground,
    textAlign: 'center',
  },
  refreshButton: {
    position: 'absolute',
    padding: spacing[3],
    bottom: spacing[6],
    left: 0,
    right: 0,
  },
  refreshLoader: {
    position: 'absolute',
    right: spacing[4],
    bottom: 0,
    top: 0,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
