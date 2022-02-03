import { StackNavigationProp } from '@react-navigation/stack';
import { ListRow, Button } from 'expo-stories/components';
import * as React from 'react';
import { Button as RNButton, FlatList, View, Text } from 'react-native';

import { getByFileId } from '../getStories';
import { styles } from '../styles';
import { RootStackParamList } from '../types';

// this is resolved via customization (extraNodeModules) in metro-config / webpack-config
// duplication is required as wrapping the require in a function seems to break fast refresh
const stories = require('generated-expo-stories');
const filesById = getByFileId(stories);

type StoryFilesListProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Story Files'>;
};

export function StoryFilesList({ navigation }: StoryFilesListProps) {
  const [selectedFileIds, setSelectedFileIds] = React.useState<string[]>([]);

  const fileIds = Object.keys(filesById);
  const allSelected = selectedFileIds.length === fileIds.length;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        const label = allSelected ? 'Clear All' : 'Select All';

        function handlePress() {
          setSelectedFileIds(allSelected ? [] : [...fileIds]);
        }

        return <RNButton title={label} onPress={handlePress} />;
      },
    });
  }, [navigation, allSelected]);

  function onSelectSingle(id: string) {
    setSelectedFileIds(currentIds =>
      currentIds.includes(id) ? currentIds.filter(i => id !== i) : [...currentIds, id]
    );
  }

  function onSeeSelectionPress() {
    navigation.navigate('Selected Stories', {
      storyFileIds: selectedFileIds,
      title: '',
    });
  }

  const files = fileIds.map(id => filesById[id]);

  return (
    <View style={styles.flexContainer}>
      <FlatList
        data={files}
        style={styles.listContainer}
        keyExtractor={item => item.id}
        renderItem={({ item: file }) => (
          <ListRow
            variant="ghost"
            label={file.title}
            onPress={() => onSelectSingle(file.id)}
            isSelected={selectedFileIds.includes(file.id)}
            multiSelectActive
          />
        )}
        ListHeaderComponent={
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>Available Story Files</Text>
          </View>
        }
      />
      {selectedFileIds.length > 0 && (
        <View style={styles.seeSelectionButtonContainer}>
          <Button label="See Selection" variant="tertiary" onPress={onSeeSelectionPress} />
        </View>
      )}
    </View>
  );
}
