import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, { componentScreensToListElements } from '../ComponentListScreen';

export const CameraScreens = [
  {
    name: 'Full Example',
    route: 'camera/expo-camera-full',
    getComponent() {
      return optionalRequire(() => require('./CameraScreenFull'));
    },
  },
  {
    name: 'Camera (barcode)',
    route: 'camera/expo-camera-barcode',
    getComponent() {
      return optionalRequire(() => require('./CameraScreenBarcode'));
    },
  },
  {
    name: 'Select Lens',
    route: 'camera/expo-camera-lens',
    getComponent() {
      return optionalRequire(() => require('./CameraScreenLenses'));
    },
  },
  {
    name: 'Camera (barcode from URL)',
    route: 'camera/expo-camera-barcode-from-url',
    getComponent() {
      return optionalRequire(() => require('./CameraScreenBarcodeFromURL'));
    },
  },
  {
    name: 'Camera pause/resume recording',
    route: 'camera/expo-camera-pause-resume',
    getComponent() {
      return optionalRequire(() => require('./CameraScreenPauseRecording'));
    },
  },
  {
    name: 'Camera Image Ref',
    route: 'camera/expo-camera-image-ref',
    getComponent() {
      return optionalRequire(() => require('./CameraScreenImageRef'));
    },
  },
];

export default function CameraScreen() {
  const apis = componentScreensToListElements(CameraScreens);
  return <ComponentListScreen apis={apis} sort={false} />;
}
