import * as React from 'react';

import ComponentListScreen from '../ComponentListScreen';

const screens = [
  {
    _name: 'ClearToBlue',
    isAvailable: true,
    name: 'Clear to blue',
    route: '/components/gl/cleartoblue',
  },
  {
    _name: 'BasicTexture',
    isAvailable: true,
    name: 'Basic texture use',
    route: '/components/gl/basictexture',
  },
  {
    _name: 'GLViewScreen',
    isAvailable: true,
    name: 'GLView example',
    route: '/components/gl/glviewscreen',
  },
  {
    _name: 'Mask',
    isAvailable: true,
    name: 'MaskedView integration',

    route: '/components/gl/mask',
  },
  {
    _name: 'Snapshots',
    isAvailable: true,
    name: 'Taking snapshots',

    route: '/components/gl/snapshots',
  },
  {
    _name: 'THREEComposer',
    isAvailable: true,
    name: 'three.js glitch and film effects',

    route: '/components/gl/threecomposer',
  },
  {
    _name: 'THREEDepthStencilBuffer',
    isAvailable: true,
    name: 'three.js depth and stencil buffer',
    route: '/components/gl/threedepthstencilbuffer',
  },
  {
    _name: 'THREESprite',
    isAvailable: true,
    name: 'three.js sprite rendering',
    route: '/components/gl/threesprite',
  },
  {
    _name: 'ProcessingInAndOut',
    isAvailable: true,
    name: "'In and out' from openprocessing.org",
    route: '/components/gl/processinginandout',
  },
  {
    _name: 'ProcessingNoClear',
    isAvailable: true,
    name: 'Draw without clearing screen with processing.js',
    route: '/components/gl/processingnoclear',
  },
  {
    _name: 'PIXIBasic',
    isAvailable: true,
    name: 'Basic pixi.js use',
    route: '/components/gl/pixibasic',
  },
  {
    _name: 'PIXISprite',
    isAvailable: true,
    name: 'pixi.js sprite rendering',
    route: '/components/gl/pixisprite',
  },
  {
    _name: 'GLCamera',
    isAvailable: true,
    name: 'Expo.Camera integration',
    route: '/components/gl/glcamera',
  },
  {
    _name: 'WebGL2TransformFeedback',
    isAvailable: true,
    name: 'WebGL2 - Transform feedback',
    route: '/components/gl/webgl2transformfeedback',
  },
  {
    _name: 'Canvas',
    isAvailable: true,
    name: 'Canvas example - expo-2d-context',
    route: '/components/gl/canvas',
  },
  {
    _name: 'HeadlessRendering',
    isAvailable: true,
    name: 'Headless rendering',
    route: '/components/gl/headlessrendering',
  },
  {
    _name: 'ReanimatedWorklets',
    isAvailable: true,
    name: 'Reanimated worklets + gesture handler',
    route: '/components/gl/reanimated',
  },
  {
    _name: 'GLViewOnBusyThread',
    isAvailable: true,
    name: 'Creating GLView when a thread is busy',
    route: '/components/gl/busythread',
  },
];

export default function GLScreen() {
  return <ComponentListScreen apis={screens} />;
}
