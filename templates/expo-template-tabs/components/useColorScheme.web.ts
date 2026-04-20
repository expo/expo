import { useColorScheme as useRNColorScheme } from 'react-native';

import { useClientOnlyValue } from './useClientOnlyValue';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  return useClientOnlyValue('light', colorScheme);
}
