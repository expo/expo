import * as React from 'react';
import { Svg, Path, Text } from 'react-native-svg';

import { Autofocus } from 'expo-camera2';

const Icon: React.FunctionComponent<{ autofocus: Autofocus }> = ({ autofocus }) => (
  <Svg
    viewBox="0 0 512 512"
    x="0px"
    y="0px"
    width={25}
    height={25}
  >
    <Text
      x="75"
      y="375"
      fontSize="300"
      fontWeight="400"
      fill={Autofocus.On === autofocus ? 'rgb(220, 190, 40)' : 'white'}
    >
      AF
    </Text>
    {Autofocus.Off === autofocus && (
      <Path d="M50,50 L462,462z" stroke="white" strokeWidth="20" fill="none" />
    )}
  </Svg>
);

export default Icon;
