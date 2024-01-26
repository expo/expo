import { useFocusEffect } from '@react-navigation/native';
import * as React from 'react';

export default function NavigationEvents(props: { children?: any; onDidFocus: () => void }) {
  useFocusEffect(
    React.useCallback(() => {
      props.onDidFocus();
    }, [props.onDidFocus])
  );

  return props.children ?? null;
}
