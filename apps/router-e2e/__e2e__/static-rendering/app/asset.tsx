import { Image } from 'react-native';

import { pageLabels } from '../lazy-labels';

const label = pageLabels[1];

export default function Page() {
  return (
    <>
      <Image accessibilityLabel={label} source={require('../../../assets/icon.png')} />
      <Image source={require('expo-router/assets/file.png')} />
    </>
  );
}
