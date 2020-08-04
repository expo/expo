import { ImageTestGroup, ImageTestPropsFnInput } from '../types';
import { tintColor } from './constants';

const backgroundColor = '#fff';

const imageTests: ImageTestGroup = {
  name: 'Shadows',
  tests: [
    {
      name: 'Shadow',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          backgroundColor,
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
    {
      name: 'Shadow: and border-radius',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          backgroundColor,
          borderRadius: range(0, 100),
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
    {
      name: 'Shadow: and separate border-radius',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          backgroundColor,
          borderTopLeftRadius: range(0, 25),
          borderTopRightRadius: range(0, 50),
          borderBottomLeftRadius: range(0, 75),
          borderBottomRightRadius: range(0, 200),
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
      name: 'Shadow: Color (iOS only)',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          backgroundColor,
          shadowColor: tintColor,
          shadowOffset: {
            width: 0,
            height: 5,
          },
          shadowOpacity: 0.7,
          shadowRadius: 10,
          elevation: 10,
        },
      }),
    },
    {
      name: 'Shadow: and no background (gives warning)',
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
    {
      name: 'Shadow: and transparent background (gives warning)',
      props: ({ range }: ImageTestPropsFnInput) => ({
        style: {
          backgroundColor: '#00000088',
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
