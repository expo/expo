import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import { SelectedStoriesDetail } from './screens/SelectedStoryDetails';
import { SelectedStoryFilesList } from './screens/SelectedStoryFilesList';
import { StoryFilesList } from './screens/StoryFilesList';
import { RootStackParamList } from './types';

const RNStack = createStackNavigator<RootStackParamList>();

export function App({ title = '' }) {
  return (
    <RNStack.Navigator>
      <RNStack.Screen name="Story Files" component={StoryFilesList} options={{ title }} />
      <RNStack.Screen
        name="Selected Stories"
        component={SelectedStoryFilesList}
        options={({ route }) => ({
          title: route.params?.title || '',
        })}
      />
      <RNStack.Screen
        name="Stories Detail"
        component={SelectedStoriesDetail}
        options={({ route }) => ({
          title: route.params?.title || '',
        })}
      />
    </RNStack.Navigator>
  );
}
