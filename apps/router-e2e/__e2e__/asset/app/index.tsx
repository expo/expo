import { Image } from 'react-native';

const ReactLogo = require('../assets/react-logo.png');

export default function Page() {
  return <Image src={ReactLogo} testID="asset-img" />;
}
