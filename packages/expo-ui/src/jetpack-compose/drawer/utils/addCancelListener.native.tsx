import { BackHandler } from 'react-native';

export const addCancelListener = (callback: () => boolean) => {
  const subscription = BackHandler.addEventListener(
    'hardwareBackPress',
    callback
  );

  return () => {
    subscription.remove();
  };
};
