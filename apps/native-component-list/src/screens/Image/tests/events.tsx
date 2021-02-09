import { ImageTestGroup, ImageTestPropsFnInput } from '../types';

const imageTests: ImageTestGroup = {
  name: 'Events',
  tests: [
    {
      name: 'onLayout',
      props: ({ event }: ImageTestPropsFnInput) => ({
        onLayout: event('onLayout'),
      }),
    },
    {
      name: 'onLoad',
      props: ({ event }: ImageTestPropsFnInput) => ({
        onLoad: event('onLoad'),
      }),
    },
    {
      name: 'onLoadStart',
      props: ({ event }: ImageTestPropsFnInput) => ({
        onLoadStart: event('onLoadStart'),
      }),
    },
    {
      name: 'onLoadEnd',
      props: ({ event }: ImageTestPropsFnInput) => ({
        onLoadEnd: event('onLoadEnd'),
      }),
    },
    {
      name: 'onError',
      props: ({ event }: ImageTestPropsFnInput) => ({
        onError: event('onError'),
      }),
    },
  ],
};

export default imageTests;
