import { HeaderHeightContext } from '@react-navigation/elements';
import { use, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation } from '../../useNavigation';

interface Args {
  noInset?: boolean;
  withHeader?: boolean;
}

export function useScrollOnSelect(args?: Args) {
  const { noInset, withHeader } = args ?? {};
  const [isFocused, setIsFocused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const insets = useSafeAreaInsets();
  const headerHeight = withHeader && HeaderHeightContext ? (use(HeaderHeightContext) ?? 0) : 0;
  const topInset = noInset ? 0 : withHeader ? headerHeight : insets.top;

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
      if (isFocused && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: -topInset, animated: true });
      }
    });
    return unsubscribe;
  }, [navigation, isFocused, scrollViewRef, topInset]);

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

  return {
    scrollViewRef,
  };
}
