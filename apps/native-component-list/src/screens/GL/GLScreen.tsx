import * as React from 'react';

import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { ListElement } from '../ComponentListScreen';

export const GLScreens = [
  {
    name: 'ClearToBlue',
    getComponent() {
      return optionalRequire(() => require('./ClearToBlueScreen'));
    },
    options: { title: 'Clear to blue' },
    route: 'gl/cleartoblue',
  },
  {
    name: 'BasicTexture',
    getComponent() {
      return optionalRequire(() => require('./BasicTextureScreen'));
    },
    options: { title: 'Basic texture use' },
    route: 'gl/basictexture',
  },
  {
    name: 'GLViewScreen',
    getComponent() {
      return optionalRequire(() => require('./GLViewScreen'));
    },
    options: { title: 'GLView example' },
    route: 'gl/glviewscreen',
  },
  {
    name: 'Mask',
    getComponent() {
      return optionalRequire(() => require('./GLMaskScreen'));
    },
    options: { title: 'MaskedView integration' },
    route: 'gl/mask',
  },
  {
    name: 'Snapshots',
    getComponent() {
      return optionalRequire(() => require('./GLSnapshotsScreen'));
    },
    options: { title: 'Taking snapshots' },
    route: 'gl/snapshots',
  },
  {
    name: 'THREEComposer',
    getComponent() {
      return optionalRequire(() => require('./GLThreeComposerScreen'));
    },
    options: { title: 'three.js glitch and film effects' },
    route: 'gl/threecomposer',
  },
  {
    name: 'THREEDepthStencilBuffer',
    getComponent() {
      return optionalRequire(() => require('./GLThreeDepthStencilBufferScreen'));
    },
    options: { title: 'three.js depth and stencil buffer' },
    route: 'gl/threedepthstencilbuffer',
  },
  {
    name: 'THREESprite',
    getComponent() {
      return optionalRequire(() => require('./GLThreeSpriteScreen'));
    },
    options: { title: 'three.js sprite rendering' },
    route: 'gl/threesprite',
  },
  {
    name: 'ProcessingInAndOut',
    getComponent() {
      return optionalRequire(() => require('./ProcessingInAndOutScreen'));
    },
    options: { title: "'In and out' from openprocessing.org" },
    route: 'gl/processinginandout',
  },
  {
    name: 'ProcessingNoClear',
    getComponent() {
      return optionalRequire(() => require('./ProcessingNoClearScreen'));
    },
    options: { title: 'Draw without clearing screen with processing.js' },
    route: 'gl/processingnoclear',
  },
  {
    name: 'PIXIBasic',
    getComponent() {
      return optionalRequire(() => require('./PIXIBasicScreen'));
    },
    options: { title: 'Basic pixi.js use' },
    route: 'gl/pixibasic',
  },
  {
    name: 'PIXISprite',
    getComponent() {
      return optionalRequire(() => require('./PIXISpriteScreen'));
    },
    options: { title: 'pixi.js sprite rendering' },
    route: 'gl/pixisprite',
  },
  {
    name: 'GLCamera',
    getComponent() {
      return optionalRequire(() => require('./GLCameraScreen'));
    },
    options: { title: 'Expo.Camera integration' },
    route: 'gl/glcamera',
  },
  {
    name: 'WebGL2TransformFeedback',
    getComponent() {
      return optionalRequire(() => require('./WebGL2TransformFeedbackScreen'));
    },
    options: { title: 'WebGL2 - Transform feedback' },
    route: 'gl/webgl2transformfeedback',
  },
  {
    name: 'Canvas',
    getComponent() {
      return optionalRequire(() => require('./CanvasScreen'));
    },
    options: { title: 'Canvas example - expo-2d-context' },
    route: 'gl/canvas',
  },
  {
    name: 'HeadlessRendering',
    getComponent() {
      return optionalRequire(() => require('./GLHeadlessRenderingScreen'));
    },
    options: { title: 'Headless rendering' },
    route: 'gl/headlessrendering',
  },
  {
    name: 'ReanimatedWorklets',
    getComponent() {
      return optionalRequire(() => require('./GLReanimatedExample'));
    },
    options: { title: 'Reanimated worklets + gesture handler' },
    route: 'gl/reanimated',
  },
  {
    name: 'GLViewOnBusyThread',
    getComponent() {
      return optionalRequire(() => require('./GLViewOnBusyThread'));
    },
    options: { title: 'Creating GLView when a thread is busy' },
    route: 'gl/busythread',
  },
];

export default function GLScreen() {
  const apis: ListElement[] = GLScreens.map((screen) => {
    return {
      name: screen.name,
      isAvailable: true,
      route: `/components/${screen.route}`,
    };
  });
  return <ComponentListScreen apis={apis} />;
}
