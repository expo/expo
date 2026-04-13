import SegmentedControl, {
  type NativeSegmentedControlChangeEvent,
} from '@expo/ui/community/segmented-control';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Adapted from https://github.com/react-native-community/segmented-control/blob/master/example

export default function SegmentedControlScreen() {
  const [values] = useState(['One', 'Two', 'Three']);
  const [value, setValue] = useState('Unselected');
  const [selectedIndex, setIndex] = useState<number | undefined>(undefined);

  const _onChange = (event: NativeSegmentedControlChangeEvent) => {
    setIndex(event.nativeEvent.selectedSegmentIndex);
  };

  const _onValueChange = (val: string) => {
    setValue(val);
  };

  return (
    <ScrollView>
      <Text style={styles.text}>
        Note: Only the last control on this screen is expected to change state
      </Text>

      <View style={styles.segmentContainer}>
        <Text style={styles.text}>Segmented controls can have values</Text>
        <SegmentedControl values={['One', 'Two', 'Three']} />
      </View>

      <View style={[styles.segmentSection, { backgroundColor: 'black' }]}>
        <SegmentedControl values={['One', 'Two', 'Three', 'Four', 'Five']} appearance="dark" />
      </View>

      <View style={styles.segmentSection}>
        <Text style={styles.text}>Segmented controls can have pre-selected values</Text>
        <SegmentedControl values={['One', 'Two']} selectedIndex={0} />
      </View>

      <View style={styles.segmentSection}>
        <Text style={styles.text}>Segmented controls can be disabled</Text>
        <SegmentedControl enabled={false} values={['One', 'Two']} selectedIndex={1} />
      </View>

      <View style={styles.segmentContainer}>
        <Text style={styles.text}>Custom tint color can be provided</Text>
        <SegmentedControl
          tintColor="#ff0000"
          values={['One', 'Two', 'Three', 'Four']}
          selectedIndex={0}
        />
      </View>
      <View style={styles.segmentContainer}>
        <SegmentedControl tintColor="#00ff00" values={['One', 'Two', 'Three']} selectedIndex={1} />
      </View>

      <View>
        <Text style={styles.text}>Selected value and index are available via callbacks</Text>
        <View style={styles.segmentContainer}>
          <SegmentedControl
            values={values}
            selectedIndex={selectedIndex}
            onChange={_onChange}
            onValueChange={_onValueChange}
          />
        </View>
        <Text style={styles.text}>
          Value: {value} Index: {selectedIndex}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    margin: 10,
  },
  segmentContainer: {
    marginBottom: 10,
  },
  segmentSection: {
    marginBottom: 25,
  },
});
