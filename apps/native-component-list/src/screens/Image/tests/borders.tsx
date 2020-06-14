import { images } from '../images';
import { ImageTestGroup, ImageTestPropsFnInput } from '../types';
import { tintColor, tintColor2 } from './constants';

const imageTests: ImageTestGroup = {
  name: 'Borders',
  tests: [
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
          borderWidth: 5,
          borderColor: tintColor,
          borderRadius: range(0, 100),
        },
      }),
    },
    {
      name: 'Dotted border',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          borderWidth: range(0, 50),
          borderColor: tintColor,
          borderStyle: 'dotted',
        },
      }),
    },
    {
      name: 'Dashed border',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          borderWidth: range(0, 50),
          borderColor: tintColor,
          borderStyle: 'dashed',
        },
      }),
    },
    {
      name: 'Separate border radius',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderTopLeftRadius: range(0, 25),
          borderTopRightRadius: range(0, 50),
          borderBottomLeftRadius: range(0, 75),
          borderBottomRightRadius: range(0, 200),
          borderWidth: 20,
          borderColor: tintColor,
        },
      }),
    },
    {
      name: 'Separate border radius dotted',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderTopLeftRadius: range(0, 25),
          borderTopRightRadius: range(0, 50),
          borderBottomLeftRadius: range(0, 75),
          borderBottomRightRadius: range(0, 200),
          borderWidth: 15,
          borderColor: tintColor,
          borderStyle: 'dotted',
        },
      }),
    },
    {
      name: 'Separate border radius dashed',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderTopLeftRadius: range(0, 25),
          borderTopRightRadius: range(0, 50),
          borderBottomLeftRadius: range(0, 75),
          borderBottomRightRadius: range(0, 200),
          borderWidth: 10,
          borderColor: tintColor,
          borderStyle: 'dashed',
        },
      }),
    },
    {
      name: 'Top border',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderTopWidth: range(0, 25),
          borderTopColor: tintColor,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        },
      }),
    },
    {
      name: 'Right border',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderRightWidth: range(0, 25),
          borderRightColor: tintColor,
          borderTopRightRadius: 10,
          borderBottomRightRadius: 10,
        },
      }),
    },
    {
      name: 'Bottom border',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderBottomWidth: range(0, 25),
          borderBottomColor: tintColor,
          borderBottomRightRadius: 10,
          borderBottomLeftRadius: 10,
        },
      }),
    },
    {
      name: 'Left border',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderLeftWidth: range(0, 25),
          borderLeftColor: tintColor,
          borderTopLeftRadius: 10,
          borderBottomLeftRadius: 10,
        },
      }),
    },
    {
      name: 'Exclude border',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderWidth: 12,
          borderColor: tintColor,
          borderRadius: 20,
          borderBottomWidth: 0,
          borderBottomLeftRadius: 0,
        },
      }),
    },
    {
      name: 'Different colors',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderTopLeftRadius: range(0, 25),
          borderTopRightRadius: range(0, 50),
          borderBottomLeftRadius: range(0, 75),
          borderBottomRightRadius: range(0, 200),
          borderTopColor: tintColor,
          borderRightColor: tintColor2,
          borderBottomColor: tintColor,
          borderLeftColor: tintColor2,
          borderWidth: 20,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 5,
          },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 10,
        },
      }),
    },
    {
      name: 'All different borders',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderTopLeftRadius: range(0, 25),
          borderTopRightRadius: range(0, 50),
          borderBottomLeftRadius: range(0, 75),
          borderBottomRightRadius: range(0, 200),
          borderTopColor: tintColor,
          borderTopWidth: 3,
          borderRightColor: tintColor2,
          borderRightWidth: 5,
          borderBottomColor: tintColor,
          borderBottomWidth: 10,
          borderLeftColor: tintColor2,
          borderLeftWidth: 20,
        },
      }),
    },
    {
      name: 'Start border (left on non RTL)',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderStartWidth: range(0, 25),
          borderStartColor: tintColor,
          borderTopStartRadius: 10,
          borderBottomStartRadius: 10,
        },
      }),
    },
    {
      name: 'End border (right on non RTL)',
      props: ({ range }: ImageTestPropsFnInput) => ({
        source: images.require_jpg1,
        style: {
          borderEndWidth: range(0, 25),
          borderEndColor: tintColor,
          borderTopEndRadius: 10,
          borderBottomEndRadius: 10,
        },
      }),
    },
  ],
};

export default imageTests;
