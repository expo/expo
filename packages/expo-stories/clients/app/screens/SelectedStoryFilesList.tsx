import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ListRow, Button } from 'expo-stories/components';
import * as React from 'react';
import { Button as RNButton, View, SectionList, Text } from 'react-native';

import { getByFileId, getByStoryId } from '../getStories';
import { styles } from '../styles';
import { RootStackParamList, StoriesExport } from '../types';

type SelectedStoryFilesListProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Selected Stories'>;
  route: RouteProp<RootStackParamList, 'Selected Stories'>;
};

// this is resolved via customization (extraNodeModules) in metro-config / webpack-config
// duplication is required as wrapping the require in a function breaks fast refresh
const stories: StoriesExport = require('generated-expo-stories');
const filesById = getByFileId(stories);
const storiesById = getByStoryId(stories);

export function SelectedStoryFilesList({ navigation, route }: SelectedStoryFilesListProps) {
  const [selectedStoryIds, setSelectedStoryIds] = React.useState<string[]>([]);

  const { storyFileIds = [] } = route.params || {};

  const storyIds = Object.keys(storiesById);
  const allSelected = selectedStoryIds.length === storyIds.length;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        const label = allSelected ? 'Clear All' : 'Select All';

        function handlePress() {
          setSelectedStoryIds(allSelected ? [] : [...storyIds]);
        }

        return <RNButton title={label} onPress={handlePress} />;
      },
    });
  }, [navigation, allSelected]);

  function onSelectSingle(id: string) {
    setSelectedStoryIds(currentIds =>
      currentIds.includes(id) ? currentIds.filter(i => id !== i) : [...currentIds, id]
    );
  }

  function onSeeSelectionPress() {
    navigation.navigate('Stories Detail', {
      selectedStoryIds,
      title: '',
    });
  }

  const data = storyFileIds.map(fileId => {
    const file = filesById[fileId];

    return {
      title: file.title,
      data: file.storyIds,
    };
  });

  return (
    <View style={styles.flexContainer}>
      <SectionList
        sections={data}
        keyExtractor={(item, index) => item + index}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item: storyId }) => {
          const story = storiesById[storyId];

          return (
            <ListRow
              variant="ghost"
              label={story.name}
              onPress={() => onSelectSingle(story.id)}
              isSelected={selectedStoryIds.includes(story.id)}
              multiSelectActive
            />
          );
        }}
      />
      {selectedStoryIds.length > 0 && (
        <View style={styles.seeSelectionButtonContainer}>
          <Button label="See Selection" variant="tertiary" onPress={onSeeSelectionPress} />
        </View>
      )}
    </View>
  );
}
