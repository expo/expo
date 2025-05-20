import { useEffect, useState } from 'react';

import { useNavigation } from '../../useNavigation';

export function useOnTabSelect(callback: () => void) {
  const [isFocused, setIsFocused] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    let tabNavigation = navigation;
    while (tabNavigation && tabNavigation.getState()?.type !== 'tab') {
      tabNavigation = tabNavigation.getParent();
    }
    if (!tabNavigation) {
      return;
    }
    const unsubscribe = tabNavigation.addListener('tabSelected' as any, () => {
      if (isFocused) {
        callback();
      }
    });
    return unsubscribe;
  }, [navigation, isFocused, callback]);

  useEffect(() => {
    const handleFocused = () => {
      setIsFocused(true);
    };
    const handleBlured = () => {
      setIsFocused(false);
    };
    navigation.addListener('blur', handleBlured);
    navigation.addListener('focus', handleFocused);
    return () => {
      navigation.removeListener('blur', handleBlured);
      navigation.removeListener('focus', handleFocused);
    };
  }, [navigation]);
}
