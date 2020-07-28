import * as React from 'react';
import { Keyboard, KeyboardEventListener } from 'react-native';

export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = React.useState<number>(0);

  const onKeyboardDidShow: KeyboardEventListener = e => {
    setKeyboardHeight(e.endCoordinates.height);
  };

  const onKeyboardDidHide: KeyboardEventListener = () => {
    setKeyboardHeight(0);
  };

  React.useEffect(() => {
    Keyboard.addListener('keyboardDidShow', onKeyboardDidShow);
    Keyboard.addListener('keyboardDidHide', onKeyboardDidHide);

    return () => {
      Keyboard.removeListener('keyboardDidShow', onKeyboardDidShow);
      Keyboard.removeListener('keyboardDidHide', onKeyboardDidHide);
    };
  }, []);

  return keyboardHeight;
}
