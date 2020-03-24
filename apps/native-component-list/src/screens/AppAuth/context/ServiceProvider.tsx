import * as React from 'react';
import ServiceContext, { defaultState } from './ServiceContext';
import AsyncStorage from '@react-native-community/async-storage';

const storageKey = 'AppAuthServiceProvider';
const shouldRehydrate = false;

async function cache(value: string) {
  await AsyncStorage.setItem(storageKey, JSON.stringify(value));
}

async function rehydrate() {
  if (!shouldRehydrate || !AsyncStorage) {
    return defaultState;
  }
  try {
    const item = await AsyncStorage.getItem(storageKey);
    const data = JSON.parse(item as string);
    return data || defaultState;
  } catch (ignored) {
    return defaultState;
  }
}

export default function ServiceProvider({ children }: any) {
  const [service, setService] = React.useState<string>(defaultState);

  React.useEffect(() => {
    rehydrate().then(service => setService(service));
  }, []);

  return (
    <ServiceContext.Provider
      value={{
        service,
        setService: service => {
          setService(service);
          cache(service);
        },
      }}>
      {service && children}
    </ServiceContext.Provider>
  );
}
