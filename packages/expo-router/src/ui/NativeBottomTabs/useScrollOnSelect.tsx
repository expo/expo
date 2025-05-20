import { HeaderHeightContext } from '@react-navigation/elements';
import { use, useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOnTabSelect } from './useOnTabSelect';

interface Args {
  noInset?: boolean;
  withHeader?: boolean;
}

export function useScrollOnSelect(args?: Args) {
  const { noInset, withHeader } = args ?? {};
  const scrollViewRef = useRef<ScrollView>(null);

  const insets = useSafeAreaInsets();
  const headerHeight = withHeader && HeaderHeightContext ? (use(HeaderHeightContext) ?? 0) : 0;
  const topInset = noInset ? 0 : withHeader ? headerHeight : insets.top;

  const onTabSelect = useCallback(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: -topInset, animated: true });
    }
  }, [scrollViewRef, topInset]);

  useOnTabSelect(onTabSelect);

  return {
    scrollViewRef,
  };
}
