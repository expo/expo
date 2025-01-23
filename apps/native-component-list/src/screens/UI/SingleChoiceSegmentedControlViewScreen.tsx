import { SingleChoiceSegmentedControlView } from '@expo/ui';
import * as React from 'react';
import { Platform, Text } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function SingleChoiceSegmentedControlViewScreen() {
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

SingleChoiceSegmentedControlViewScreen.navigationOptions = {
  title: 'SingleChoiceSegmentedControlViewScreen',
};
