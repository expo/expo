import { SingleChoiceSegmentedControlView } from 'expo-ui';
import * as React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

import { Page, Section } from '../components/Page';

export default function UIScreen() {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  return (
    <Page>
      {Platform.OS !== 'android' ? null : (
        <>
          <Section title="SingleChoiceSegmentedControlView" row>
            <Text>{selectedIndex}</Text>
            <SingleChoiceSegmentedControlView
              options={['$', '$$', '$$$', '$$$$']}
              selectedIndex={selectedIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedIndex(index);
              }}
              style={{
                width: 300,
                height: 100,
              }}
            />
          </Section>
        </>
      )}
    </Page>
  );
}

UIScreen.navigationOptions = {
  title: 'Expo UI',
};
