import * as React from 'react';
import { Platform } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

export function GestureHandlerTouchableWrapper({ onPress, disabled = false, children }) {
  if (Platform.OS === 'android') {
    return (
      <TouchableWithoutFeedback disabled={disabled} onPress={onPress}>
        {children}
      </TouchableWithoutFeedback>
    );
  }

  return children;
}
