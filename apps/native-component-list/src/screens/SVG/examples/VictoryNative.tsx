import * as Font from 'expo-font';
import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import * as Svg from 'react-native-svg';
import { VictoryArea, VictoryChart, VictoryStack } from 'victory-native';

import Example from './Example';

class VictoryChartExample extends React.Component {
  static title = 'VictoryChart';

  render() {
    return (
      <View>
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
        <Svg.Svg width={Dimensions.get('window').width} height={50}>
          <Svg.Text
            fill="#fff"
            stroke="#000"
            fontSize={15}
            fontFamily={Font.processFontFamily('space-mono')!}
            x={25}
            y={15}>
            drawn with victory-native
          </Svg.Text>
        </Svg.Svg>
      </View>
    );
  }
}

const icon = <Text>VN</Text>;

const VictoryNative: Example = {
  icon,
  samples: [VictoryChartExample],
};

export default VictoryNative;
