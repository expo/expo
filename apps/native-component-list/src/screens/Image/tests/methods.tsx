import ExpoImage from 'expo-image';
import { Image as ReactImage } from 'react-native';

import { images } from '../images';
import { ImageTestGroup } from '../types';

const imageTests: ImageTestGroup = {
  name: 'Methods',
  tests: [
    {
      name: 'prefetch',
      props: {
        source: images.uri_lorem_picsum,
        defaultSource: images.require_monochrome,
      },
      loadOnDemand: true,
      method: ExpoImage.prefetch,
      reactMethod: ReactImage.prefetch,
    },
  ],
};

export default imageTests;
