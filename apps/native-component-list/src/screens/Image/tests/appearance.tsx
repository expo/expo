import { anyAnimationDriver, tintColor, tintColor2 } from './constants';
import { ImageTestGroup, ImageTestPropsFnInput } from '../types';

const imageTests: ImageTestGroup = {
  name: 'Appearance',
  tests: [
    {
      name: 'Plain',
      props: {},
    },
    {
      name: `Resize mode: cover`,
      props: {
        resizeMode: 'cover',
      },
    },
    {
      name: `Resize mode: contain`,
      props: {
        resizeMode: 'contain',
      },
    },
    {
      name: `Resize mode: stretch`,
      props: {
        resizeMode: 'stretch',
      },
    },
    {
      name: `Resize mode: center`,
      props: {
        resizeMode: 'center',
      },
    },
    {
      name: `Resize mode: repeat`,
      props: {
        resizeMode: 'repeat',
      },
    },
    {
      name: `No size`,
      props: {
        defaultStyle: {},
      },
    },
    {
      name: `Explicit size`,
      props: {
        defaultStyle: {},
        style: {
          backgroundColor: tintColor,
          width: 100,
          height: 30,
        },
      },
    },
    {
      name: 'Blur radius',
      animationDriver: anyAnimationDriver,
      props: ({ range }: ImageTestPropsFnInput) => ({
        blurRadius: range(0, 60),
      }),
    },
    {
      name: 'Opacity',
      animationDriver: anyAnimationDriver,
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          opacity: range(0, 1),
        },
      }),
    },
    {
      name: 'Tint color',
      props: {
        tintColor,
        style: {
          tintColor,
        },
      },
    },
    {
      name: 'Tint color 2',
      props: {
        tintColor: tintColor2,
        style: {
          tintColor: tintColor2,
        },
      },
    },
    {
      name: 'Background color',
      props: {
        style: {
          backgroundColor: tintColor,
        },
      },
    },
    {
      name: 'Background color and radius',
      props: {
        style: {
          backgroundColor: tintColor,
          borderRadius: 30,
        },
      },
    },
  ],
};

export default imageTests;
