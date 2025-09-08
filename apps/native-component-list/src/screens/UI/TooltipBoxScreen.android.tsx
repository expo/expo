import { Shape, TooltipBox } from '@expo/ui/jetpack-compose';
import { Container, Column, Text } from '@expo/ui/jetpack-compose-primitives';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const longText = `
  This text is going to be longer so we can text that the container scales as it grows. Here it should fit at least 3-5 lines of text.

  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`;

export default function TooltipBoxScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Container style={styles.halfContainer}>
          <Column verticalArrangement="spaceEvenly" horizontalAlignment="center">
            <TooltipBox text="Basic tooltip">
              <Text fontSize={16}>Basic tooltip</Text>
            </TooltipBox>
          </Column>
        </Container>
      </View>

      <View style={styles.row}>
        <Container style={styles.halfContainer}>
          <Column verticalArrangement="spaceEvenly" horizontalAlignment="center">
            <TooltipBox text={longText}>
              <Text color="green">Longer text tooltip</Text>
            </TooltipBox>
          </Column>
        </Container>
      </View>

      <View style={styles.row}>
        <Container style={styles.halfContainer}>
          <Column verticalArrangement="spaceEvenly" horizontalAlignment="center">
            <TooltipBox text={longText}>
              <View style={styles.pillStar}>
                <Shape.PillStar
                  style={styles.pillStar}
                  radius={1}
                  innerRadius={0.7}
                  smoothing={1}
                  cornerRounding={0.05}
                  verticesCount={12}
                  color="green"
                />
              </View>
            </TooltipBox>
          </Column>
        </Container>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  halfContainer: {
    flex: 1,
    padding: 16,
  },
  pillStar: {
    width: 180,
    height: 100,
  },
});

TooltipBoxScreen.navigationOptions = {
  title: 'TooltipBox',
};
