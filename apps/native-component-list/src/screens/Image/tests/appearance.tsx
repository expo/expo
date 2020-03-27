import { ImageTestGroup, ImageTestPropsFnInput } from '../types';
import { tintColor, tintColor2 } from './constants';

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
      props: ({ range }: ImageTestPropsFnInput) => ({
        blurRadius: range(0, 60),
      }),
    },
    {
      name: 'Border color',
      props: {
        style: {
          borderWidth: 5,
          borderColor: tintColor,
        },
      },
    },
    {
      name: 'Border width',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          borderWidth: range(0, 20),
          borderColor: tintColor,
        },
      }),
    },
    {
      name: 'Border radius',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          borderRadius: range(0, 100),
        },
      }),
    },
    {
      name: 'Border radius: separate corners',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          borderTopLeftRadius: range(0, 25),
          borderTopRightRadius: range(0, 50),
          borderBottomLeftRadius: range(0, 75),
          borderBottomRightRadius: range(0, 100),
          borderWidth: 5,
          borderColor: tintColor,
        },
      }),
    },
    {
      name: 'Borders: separate edges',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          borderLeftWidth: range(0, 25),
          borderLeftColor: tintColor,
          borderTopWidth: range(0, 25),
          borderTopColor: tintColor2,
          borderRightWidth: range(0, 25),
          borderRightColor: tintColor,
          borderBottomWidth: range(0, 25),
          borderBottomColor: tintColor2,
        },
      }),
    },

    {
      name: 'Opacity',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          opacity: range(0, 1),
        },
      }),
    },
    {
      name: 'Tint color',
      props: {
        style: {
          tintColor,
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
      name: 'Shadow',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: range(2, 5),
          },
          shadowOpacity: range(0.2, 0.5),
          shadowRadius: range(0, 10),
          elevation: range(0, 10),
        },
      }),
    },
  ],
};

export default imageTests;
