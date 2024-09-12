import { createContext } from 'react';

export type ProtocolType = 'expo-go' | 'custom' | 'web';

export const TABS_MAPPING: { name: string; id: ProtocolType }[] = [
  { name: 'Expo Go', id: 'expo-go' },
  { name: 'Custom', id: 'custom' },
  { name: 'Web', id: 'web' },
];

export const SharedContext = createContext<{
  type: ProtocolType;
  setType: (type: ProtocolType) => void;
} | null>(null);

export function getProtocol(type: ProtocolType) {
  return { 'expo-go': 'exp://127.0.0.1:8081/--/', web: 'acme.dev/', custom: 'acme://' }[type];
}
