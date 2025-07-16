import { Container, Column, Row, Text } from '@expo/ui/jetpack-compose-primitives';
import { useState } from 'react';
import { Button, View, StyleSheet, Text as RNText } from 'react-native';

export default function JetpackComposePrimitivesScreen() {
  const [checked, setChecked] = useState<boolean>(true);
  return (
    <Container style={styles.container} testID="container">
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
        <Row horizontalArrangement="spaceAround" verticalAlignment="center" testID="rowParent">
          <Column verticalArrangement="center" horizontalAlignment="center" testID="nestedColumn1">
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
        </Row>
      </Column>
    </Container>
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
