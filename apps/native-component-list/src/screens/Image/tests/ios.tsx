import { ImageTestGroup, ImageTestPropsFnInput } from '../types';

const imageTests: ImageTestGroup = {
  name: 'iOS',
  tests: [
    {
      name: 'accessibilityLabel',
      props: {
        accessibilityLabel: 'Test goes here',
      },
    },
    {
      name: 'accessible',
      props: {
        accessible: true,
      },
    },
    {
      name: 'capInsets',
      props: ({ range }: ImageTestPropsFnInput) => ({
        capInsets: {
          top: range(0, 5),
          left: range(0, 10),
          bottom: range(0, 15),
          right: range(0, 20),
        },
      }),
    },
    {
      name: 'onPartialLoad',
      props: ({ event }: ImageTestPropsFnInput) => ({
        onPartialLoad: event('onPartialLoad'),
      }),
    },
    {
      name: 'onProgress',
      props: ({ event }: ImageTestPropsFnInput) => ({
        onProgress: event('onProgress'),
      }),
    },
  ],
};

export default imageTests;
