import * as React from 'react';

import { Splash } from './Splash';
import { getInitialData } from '../functions/getInitialData';

type LoadInitialDataProps = {
  children: React.ReactElement<any>;
  loader?: React.ReactElement<any>;
};

export function LoadInitialData({ children, loader = <Splash /> }: LoadInitialDataProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [initialData, setInitialData] = React.useState({});

  React.useEffect(() => {
    getInitialData().then((data) => {
      setInitialData(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return loader;
  }

  return React.cloneElement(children, initialData);
}
