import { NavigationProp, NavigationState } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';

import type { useNavigation } from '../../useNavigation';

interface Args {
  navigation: ReturnType<
    typeof useNavigation<
      Omit<NavigationProp<ReactNavigation.RootParamList>, 'getState'> & {
        getState(): NavigationState | undefined;
      }
    >
  >;
  topInset: number;
}

export function useScrollOnSelect({ navigation, topInset }: Args) {
  const [isFocused, setIsFocused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const handleTabSelected = () => {
      if (isFocused && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: -topInset, animated: true });
      }
    };
    navigation.addListener('tabSelected' as any, handleTabSelected);
    return () => {
      navigation.removeListener('tabSelected' as any, handleTabSelected);
    };
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
