import * as React from 'react';
import { Keyboard } from 'react-native';

export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = React.useState<number>(0);

  React.useEffect(() => {
    const didShowEmitter = Keyboard.addListener('keyboardDidShow', ({ endCoordinates }) => {
      setKeyboardHeight(endCoordinates.height);
    });
    const didHideEmitter = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      didShowEmitter.remove();
      didHideEmitter.remove();
    };
  }, []);

  return keyboardHeight;
}
