import { images } from '../images';
import { ImageMethodNames, ImageTestGroup } from '../types';

const imageTests: ImageTestGroup = {
  name: 'Methods',
  tests: [
    {
      name: 'prefetch',
      props: {
        source: images.uri_png,
        defaultSource: images.require_monochrome,
      },
      loadOnDemand: true,
      method: ImageMethodNames.Prefetch,
    },
  ],
};

export default imageTests;
