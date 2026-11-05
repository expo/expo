import { Box, Host, LazyRow, RNHostView, Row, Text } from '@expo/ui/jetpack-compose';
import { clickable, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import { Pressable, ScrollView, Text as RNText, View } from 'react-native';

import {
  ReactNativeRow,
  styles,
  TOUCH_CASES,
  useCounts,
  type TouchCase,
} from './RNHostViewTouchCases';

// Each row is a Compose `clickable` `Row` with React Native content hosted in an `RNHostView`.
// Plain hosted content passes a tap to the row. Hosted content that handles the press keeps it,
// the same as in the React Native rows at the bottom.
export default function RNHostViewInClickableScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {TOUCH_CASES.map((touchCase) => (
        <ClickableRow key={touchCase.name} touchCase={touchCase} />
      ))}
      <RNText style={styles.section}>Compose LazyRow inside a React Native Pressable</RNText>
      <OuterPressableList />
      <RNText style={styles.section}>React Native rows</RNText>
      {TOUCH_CASES.map((touchCase) => (
        <ReactNativeRow key={touchCase.name} touchCase={touchCase} />
      ))}
    </ScrollView>
  );
}

function ClickableRow({ touchCase }: { touchCase: TouchCase }) {
  const { row, inner, onRowPress, onInnerPress } = useCounts();
  const { name } = touchCase;
  return (
    <View>
      <RNText testID={`${name}-counts`}>
        {name}: row {row}, inner {inner}
      </RNText>
      <Host matchContents>
        <Row modifiers={[clickable(onRowPress), padding(12, 12, 12, 12)]}>
          <Text>{`${name}  `}</Text>
          <RNHostView matchContents>
            <View testID={`${name}-hosted`}>{touchCase.render(onInnerPress)}</View>
          </RNHostView>
        </Row>
      </Host>
    </View>
  );
}

// A scroll that starts on hosted text belongs to the Compose row, so the outer `Pressable` must not
// press. A tap on hosted text with no Compose handler around it still presses the `Pressable`.
function OuterPressableList() {
  const { row, onRowPress } = useCounts();
  return (
    <View>
      <RNText testID="outer-pressable-counts">outer: {row}</RNText>
      <Pressable onPress={onRowPress}>
        <Host style={{ height: 60 }}>
          <LazyRow>
            {Array.from({ length: 20 }, (_, index) => (
              <Box key={index} modifiers={[padding(8, 8, 8, 8)]}>
                <RNHostView matchContents>
                  <RNText testID={`outer-item-${index}`}>{`Hosted item ${index}`}</RNText>
                </RNHostView>
              </Box>
            ))}
          </LazyRow>
        </Host>
      </Pressable>
    </View>
  );
}
