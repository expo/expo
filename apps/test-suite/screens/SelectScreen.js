import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Button,
  FlatList,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-navigation';

import PlatformTouchable from '../components/PlatformTouchable';
import ModulesContext from '../ModulesContext';

function CheckListItem({ onPress, isSelected, title }) {
  return (
    <PlatformTouchable onPress={onPress}>
      <View style={styles.listItem}>
        <View style={{ minWidth: 26, minHeight: 26 }}>
          <MaterialIcons name={isSelected ? 'check-box' : 'check-box-outline-blank'} size={26} />
        </View>
        <Text style={styles.label}>{title}</Text>
      </View>
    </PlatformTouchable>
  );
}

export default function SelectionList({ navigation }) {
  const { modules, setIsTestActive, onToggleAll } = React.useContext(ModulesContext);

  const selected = modules.filter(({ isActive }) => isActive);
  const allSelected = selected.length === modules.length;
  const buttonTitle = allSelected ? 'Deselect All' : 'Select All';
  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={modules}
        keyExtractor={({ name }, index) => `${index}-${name}`}
        renderItem={({ item: { name, isActive } }) => (
          <CheckListItem
            onPress={() => setIsTestActive(name, !isActive)}
            isSelected={isActive}
            title={name}
          />
        )}
      />
      <SafeAreaView style={styles.buttonRow}>
        <View style={styles.buttonContainer}>
          <Button title={buttonTitle} onPress={onToggleAll} />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Run Tests"
            onPress={() => {
              if (selected.length) {
                navigation.navigate('RunTests');
              } else {
                Alert.alert('Cannot Run Tests', 'You must select at least one test to run.');
              }
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  listItem: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#dddddd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: 'black',
    fontSize: 18,
    marginLeft: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: '#ECEFF1',
  },
  buttonContainer: {
    flex: 1,
    marginLeft: Platform.OS === 'android' ? 10 : 0,
    marginRight: Platform.OS === 'android' ? 10 : 0,
  },
});

SelectionList.navigationOptions = {
  title: 'Test Suite',
};
