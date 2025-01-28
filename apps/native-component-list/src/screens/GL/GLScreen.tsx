import * as React from 'react';

import ComponentListScreen from '../ComponentListScreen';

const screens = [
  {
    screenName: 'ClearToBlue',
    isAvailable: true,
    name: 'Clear to blue',
    route: '/components/gl/cleartoblue',
  },
  {
    screenName: 'BasicTexture',
    isAvailable: true,
    name: 'Basic texture use',
    route: '/components/gl/basictexture',
  },
  {
    screenName: 'GLViewScreen',
    isAvailable: true,
    name: 'GLView example',
    route: '/components/gl/glviewscreen',
  },
  {
    screenName: 'Mask',
    isAvailable: true,
    name: 'MaskedView integration',

    route: '/components/gl/mask',
  },
  {
    screenName: 'Snapshots',
    isAvailable: true,
    name: 'Taking snapshots',

    route: '/components/gl/snapshots',
  },
  {
    screenName: 'THREEComposer',
    isAvailable: true,
    name: 'three.js glitch and film effects',

    route: '/components/gl/threecomposer',
  },
  {
    screenName: 'THREEDepthStencilBuffer',
    isAvailable: true,
    name: 'three.js depth and stencil buffer',
    route: '/components/gl/threedepthstencilbuffer',
  },
  {
    screenName: 'THREESprite',
    isAvailable: true,
    name: 'three.js sprite rendering',
    route: '/components/gl/threesprite',
  },
  {
    screenName: 'ProcessingInAndOut',
    isAvailable: true,
    name: "'In and out' from openprocessing.org",
    route: '/components/gl/processinginandout',
  },
  {
    screenName: 'ProcessingNoClear',
    isAvailable: true,
    name: 'Draw without clearing screen with processing.js',
    route: '/components/gl/processingnoclear',
  },
  {
    screenName: 'PIXIBasic',
    isAvailable: true,
    name: 'Basic pixi.js use',
    route: '/components/gl/pixibasic',
  },
  {
    screenName: 'PIXISprite',
    isAvailable: true,
    name: 'pixi.js sprite rendering',
    route: '/components/gl/pixisprite',
  },
  {
    screenName: 'GLCamera',
    isAvailable: true,
    name: 'Expo.Camera integration',
    route: '/components/gl/glcamera',
  },
  {
    screenName: 'WebGL2TransformFeedback',
    isAvailable: true,
    name: 'WebGL2 - Transform feedback',
    route: '/components/gl/webgl2transformfeedback',
  },
  {
    screenName: 'Canvas',
    isAvailable: true,
    name: 'Canvas example - expo-2d-context',
    route: '/components/gl/canvas',
  },
  {
    screenName: 'HeadlessRendering',
    isAvailable: true,
    name: 'Headless rendering',
    route: '/components/gl/headlessrendering',
  },
  {
    screenName: 'ReanimatedWorklets',
    isAvailable: true,
    name: 'Reanimated worklets + gesture handler',
    route: '/components/gl/reanimated',
  },
  {
    screenName: 'GLViewOnBusyThread',
    isAvailable: true,
    name: 'Creating GLView when a thread is busy',
    route: '/components/gl/busythread',
  },
];

export default function GLScreen() {
  return <ComponentListScreen apis={screens} />;
}
