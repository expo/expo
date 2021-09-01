import { images } from '../images';
import { ImageTestGroup, ImageTestPropsFnInput } from '../types';

const imageTests: ImageTestGroup = {
  name: 'Android',
  tests: [
    {
      name: 'Default source',
      props: {
        source: images.require_highres,
        defaultSource: images.require_monochrome,
      },
      loadOnDemand: true,
    },
    {
      name: 'Resize method: auto',
      props: {
        resizeMethod: 'auto',
      },
    },
    {
      name: 'Resize method: resize',
      props: {
        resizeMethod: 'resize',
      },
    },
    {
      name: 'Resize method: scale',
      props: {
        resizeMethod: 'scale',
      },
    },
    {
      name: 'Fade duration',
      props: ({ range }: ImageTestPropsFnInput) => ({
        fadeDuration: range(0, 1000),
      }),
    },
    {
      name: 'Progressive rendering',
      props: {
        progressiveRenderingEnabled: true,
      },
    },
  ],
};

export default imageTests;
