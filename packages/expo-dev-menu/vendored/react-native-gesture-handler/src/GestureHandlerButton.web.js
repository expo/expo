import React from 'react';
import { View } from 'react-native';

export default React.forwardRef((props, ref) => (
  <View ref={ref} accessibilityRole="button" {...props} />
));
