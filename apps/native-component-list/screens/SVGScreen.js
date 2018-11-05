import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { VictoryChart, VictoryStack, VictoryArea } from 'victory-native';
import Svg, { Text } from 'react-native-svg';
import { Font } from 'expo';

export default class SVGScreen extends React.Component {
  static navigationOptions = {
    title: '<Svg />',
  };

  render() {
    return (
      <View style={styles.container}>
        <VictoryChart>
          <VictoryStack>
            <VictoryArea
              data={[
                { x: 'a', y: 2 },
                { x: 'b', y: 3 },
                { x: 'c', y: 5 },
                { x: 'd', y: 4 },
                { x: 'e', y: 7 },
              ]}
            />
            <VictoryArea
              data={[
                { x: 'a', y: 1 },
                { x: 'b', y: 4 },
                { x: 'c', y: 5 },
                { x: 'd', y: 7 },
                { x: 'e', y: 5 },
              ]}
            />
            <VictoryArea
              data={[
                { x: 'a', y: 3 },
                { x: 'b', y: 2 },
                { x: 'c', y: 6 },
                { x: 'd', y: 2 },
                { x: 'e', y: 6 },
              ]}
            />
            <VictoryArea
              data={[
                { x: 'a', y: 2 },
                { x: 'b', y: 3 },
                { x: 'c', y: 3 },
                { x: 'd', y: 4 },
                { x: 'e', y: 7 },
              ]}
            />
          </VictoryStack>
        </VictoryChart>

        <Svg width={Dimensions.get('window').width} height={50}>
          <Text
            fill="#fff"
            stroke="#000"
            fontSize={15}
            fontFamily={Font.processFontFamily('space-mono')}
            x={25}
            y={15}>
            drawn with victory-native
          </Text>
        </Svg>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
