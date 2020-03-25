import * as React from 'react';
import ServiceContext, { defaultService } from './ServiceContext';
import Services from '../constants/Services';
import AsyncStorage from './AsyncStorage';

const storageKey = 'AppAuthServiceProvider';
const shouldRehydrate = true;

async function cache(value: string) {
  if (!AsyncStorage) return;
  await AsyncStorage.setItem(storageKey, JSON.stringify(value));
}

async function rehydrate() {
  if (!shouldRehydrate || !AsyncStorage) {
    return defaultService;
  }
  try {
    const item = await AsyncStorage.getItem(storageKey);
    const data = JSON.parse(item as string);
    return data ?? defaultService;
  } catch (ignored) {
    return defaultService;
  }
}

export default function ServiceProvider({ children }: any) {
  const [service, setService] = React.useState<string>(defaultService);

  React.useEffect(() => {
    rehydrate().then(service => setService(service));
  }, []);

  const nextValidService = service in Services ? service : defaultService;
  return (
    <ServiceContext.Provider
      value={{
        service: nextValidService,
        setService: service => {
          setService(service);
          cache(service);
        },
      }}>
      {service && children}
    </ServiceContext.Provider>
  );
}
