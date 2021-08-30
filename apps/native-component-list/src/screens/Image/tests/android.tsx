import { ImageTestGroup, ImageTestPropsFnInput } from '../types';

const imageTests: ImageTestGroup = {
  name: 'Android',
  tests: [
    {
      name: 'accessible',
      props: {
        accessible: true,
      },
      testInformation:
        'To properly conduct test:\n1. Turn on TalkBack.\n2. Click on image.\nExpected behaviour: the component should be bordered and default sound should be played',
    },
    {
      name: 'accessibilityLabel',
      props: {
        accessibilityLabel: 'Test passed',
      },
      testInformation:
        'To properly conduct test:\n1. Turn on TalkBack.\n2. Click on image.\nExpected behaviour: the component should be bordered and you should hear text specified as a value of `accessibleLabel` property: "text passed"',
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
