import { View } from 'expo-dev-client-components';
import * as React from 'react';

import { loadFontsAsync } from '../native-modules/DevMenu';
import { Splash } from './Splash';

type LoadInitialDataProps = {
  children: React.ReactElement<any> | React.ReactElement<any>[];
  loader?: React.ReactElement<any>;
};

export function LoadInitialData({ children, loader = <Splash /> }: LoadInitialDataProps) {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadFontsAsync().then(() => {
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return loader;
  }

  return <View flex="1">{children}</View>;
}
