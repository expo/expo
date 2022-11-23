import { Providers } from 'expo-maps/build/Map.types';
import { createContext } from 'react';

const ProviderContext = createContext<Providers>('google');

export default ProviderContext;
