import {
  background,
  size,
  weight,
  testID,
  matchParentSize,
  blur,
  clickable,
  animateContentSize,
  paddingAll,
  Host,
} from '@expo/ui/jetpack-compose';
import { Column, Row, Box, Text } from '@expo/ui/jetpack-compose-primitives';
import { useState } from 'react';
import { Button, View, StyleSheet, Text as RNText } from 'react-native';

export default function JetpackComposePrimitivesScreen() {
  const [checked, setChecked] = useState<boolean>(true);
  return (
    <Host style={styles.container} modifiers={[testID('container')]}>
      <Column verticalArrangement="spaceEvenly" horizontalAlignment="center">
        {/* Example 1: Row with Text and Switch */}
        <Row horizontalArrangement="spaceBetween" verticalAlignment="center" testID="leftTextRow">
          <Text fontSize={18} fontWeight="bold" color="#ff0000">
            Left Text
          </Text>
        </Row>

        {/* Example 2: Column with different Text styles */}
        <Column verticalArrangement="spaceEvenly" horizontalAlignment="center">
          <Text fontSize={24} fontWeight="bold" color="#ff0000" testID="largeBoldText">
            Large Bold Text
          </Text>
          <Text fontSize={16} fontWeight="normal" color="#00ff00" testID="mediumNormalText">
            Medium Normal Text
          </Text>
          <Text fontSize={12} fontWeight="300" color="#666666" testID="smallLightText">
            Small Light Text
          </Text>
          <View style={{ width: 200, height: 100, backgroundColor: 'green' }}>
            <RNText style={{ fontSize: 16 }}>Text in Android view</RNText>
            <Button title="Click me" onPress={() => setChecked(!checked)} />
          </View>
        </Column>

        {/* Example 3: Nested Row and Column with Text */}
        <Row
          horizontalArrangement="spaceAround"
          verticalAlignment="center"
          testID="rowParent"
          modifiers={[size(300, 300), background('#ffdddd')]}>
          <Column
            modifiers={[background('#ff0000'), weight(2)]}
            verticalArrangement="center"
            horizontalAlignment="center"
            testID="nestedColumn1">
            <Text fontSize={16} fontWeight="500" testID="nestedColumn1Text">
              Nested
            </Text>
            <Text fontSize={14} color="#333333">
              Column 1
            </Text>
          </Column>
          <Column verticalArrangement="center" horizontalAlignment="center" testID="nestedColumn2">
            <Text fontSize={16} fontWeight="500" testID="nestedColumn2Text">
              Nested
            </Text>
            <Text fontSize={14} color="#333333">
              Column 2
            </Text>
          </Column>
          <Column
            modifiers={[background('#ff0000'), weight(4)]}
            verticalArrangement="center"
            horizontalAlignment="center"
            testID="nestedColumn2">
            <Text fontSize={16} fontWeight="500" testID="nestedColumn2Text">
              Nested
            </Text>
            <Text fontSize={14} color="#333333">
              Column 3
            </Text>
          </Column>
          <Column verticalArrangement="center" horizontalAlignment="center" testID="nestedColumn2">
            <Text fontSize={16} fontWeight="500" testID="nestedColumn2Text">
              Nested
            </Text>
            <Text fontSize={14} color="#333333">
              Column 4
            </Text>
          </Column>
        </Row>
        {/* Example 3: Two nested boxes */}
        <Box
          modifiers={[
            animateContentSize(0.5, 100),
            size(200, checked ? 100 : 200),
            background('#ffdddd'),
            blur(10),
            clickable(() => setChecked((c) => !c)),
          ]}>
          <Box modifiers={[matchParentSize(), paddingAll(30), background('#ddddff')]} />
        </Box>
      </Column>
    </Host>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});

JetpackComposePrimitivesScreen.navigationOptions = {
  title: 'Jetpack Compose primitives',
};
