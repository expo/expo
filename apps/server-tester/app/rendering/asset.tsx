import { Image } from 'react-native';

import { Page } from '@/components/Page';
import { pageLabels } from '@/lib/lazy-labels';

const label = pageLabels[1];

export default function AssetRoute() {
  return (
    <Page title="Asset" testID="rendering-asset">
      <Image accessibilityLabel={label} source={require('../../assets/icon.png')} />
      <Image source={require('expo-router/assets/file.png')} />
    </Page>
  );
}
