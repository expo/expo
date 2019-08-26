import * as React from 'react';
import { ScrollView, useTheme } from 'react-navigation';
import Colors from '../constants/Colors';

export default (props: ScrollView['props']) => {
  let theme = useTheme();
  let { style, ...otherProps } = props;

  return (
    <ScrollView
      style={[
        { backgroundColor: Colors[theme].bodyBackground },
        style,
      ]}
      {...otherProps}
    />
  );
};