import * as React from 'react';
import { Svg, Path, Text } from 'react-native-svg';

import { HDR } from 'expo-camera2';

const Icon: React.FunctionComponent<{ hdr: HDR }> = ({ hdr }) => (
  <Svg
    viewBox="0 0 512 512"
    x="0px"
    y="0px"
    width={25}
    height={25}
  >
    <Text
      x="0"
      y="350"
      fontSize="250"
      fontWeight="400"
      fill={HDR.On === hdr ? 'rgb(220, 190, 40)' : 'white'}
    >
      HDR
    </Text>
    {HDR.Off === hdr && (
      <Path d="M50,50 L462,462z" stroke="white" strokeWidth="20" fill="none" />
    )}
  </Svg>
);

export default Icon;
