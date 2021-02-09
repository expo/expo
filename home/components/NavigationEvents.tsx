import { useNavigation } from '@react-navigation/native';
import * as React from 'react';

export default function NavigationEvents(props: { children?: any; onDidFocus: () => void }) {
  const navigation = useNavigation();

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // The screen is focused
      props.onDidFocus();
    });
    // Return the function to unsubscribe from the event so it gets removed on unmount
    return () => {
      unsubscribe();
    };
  }, [navigation]);

  return props.children ?? null;
}
