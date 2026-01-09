import ExpoBrownfield from 'expo-brownfield';
import { useNavigation } from 'expo-router';
import { useEffect } from 'react';

const useBackHandling = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      const shouldEnableNativeBack = navigation.canGoBack();
      ExpoBrownfield.setNativeBackEnabled(!shouldEnableNativeBack);
    });

    return () => {
      unsubscribe();
    };
  }, [navigation]);
};

export default useBackHandling;
