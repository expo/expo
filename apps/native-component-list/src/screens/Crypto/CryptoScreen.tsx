import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { apiScreensToListElements } from '../ComponentListScreen';

export const CryptoScreens = [
  {
    name: 'General Crypto',
    route: 'expo-crypto/general',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./GeneralCryptoScreen'));
    },
  },
  {
    name: 'AES Encryption',
    route: 'expo-crypto/aes',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./AESCryptoScreen'));
    },
  },
];

export default function CryptoScreen() {
  const apis = apiScreensToListElements(CryptoScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
