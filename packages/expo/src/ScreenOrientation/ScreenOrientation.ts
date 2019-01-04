import ExponentScreenOrientation from './ExponentScreenOrientation';
import { UnavailabilityError } from 'expo-errors';
import { EmitterSubscription, NativeEventEmitter, Platform } from 'react-native';

export enum Orientation {
  UNKNOWN = 'UNKNOWN',
  PORTRAIT = 'PORTRAIT',
  PORTRAIT_UP = 'PORTRAIT_UP',
  PORTRAIT_DOWN = 'PORTRAIT_DOWN',
  LANDSCAPE = 'LANDSCAPE',
  LANDSCAPE_LEFT = 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT = 'LANDSCAPE_RIGHT',
}

export enum OrientationLock {
  DEFAULT = 'DEFAULT',
  ALL = 'ALL',
  PORTRAIT = 'PORTRAIT',
  PORTRAIT_UP = 'PORTRAIT_UP',
  PORTRAIT_DOWN = 'PORTRAIT_DOWN',
  LANDSCAPE = 'LANDSCAPE',
  LANDSCAPE_LEFT = 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT = 'LANDSCAPE_RIGHT',
  OTHER = 'OTHER',
  ALL_BUT_UPSIDE_DOWN = 'ALL_BUT_UPSIDE_DOWN', // deprecated
}

enum iOSSizeClass {
  VERTICAL = 'VERTICAL',
  HORIZONTAL = 'HORIZONTAL',
  UNKNOWN = 'UNKNOWN',
};

type OrientationInfo = {
  orientation: Orientation;
  verticalSizeClass?: iOSSizeClass;
  horizontalSizeClass?: iOSSizeClass;
};

type PlatformInfo = {
  screenOrientationConstantAndroid?: number;
  screenOrientationArrayIOS?: Orientation[];
};

type OrientationChangeListener = (event: OrientationChangeEvent) => void;

type OrientationChangeEvent = {
  orientationLock: OrientationLock;
  orientationInfo: OrientationInfo;
};

const _orientationChangeEmitter = new NativeEventEmitter(ExponentScreenOrientation);
let _orientationChangeSubscribers: EmitterSubscription[] = [];

export function allow(orientationLock: OrientationLock): void {
  console.warn("'ScreenOrientation.allow' is deprecated in favour of 'ScreenOrientation.lockAsync'");
  lockAsync(orientationLock);
}

export async function allowAsync(orientationLock: OrientationLock): Promise<void> {
  console.warn("'ScreenOrientation.allowAsync' is deprecated in favour of 'ScreenOrientation.lockAsync'");
  await lockAsync(orientationLock);
}

export async function lockAsync(orientationLock: OrientationLock): Promise<void> {
  if (!ExponentScreenOrientation.lockAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'lockAsync');
  }

  if (typeof orientationLock !== 'string'){
    throw new TypeError(`lockAsync cannot be called with ${orientationLock}`);
  }
  
  await ExponentScreenOrientation.lockAsync(orientationLock);
}

export async function lockPlatformAsync(options: PlatformInfo): Promise<void> {
  if (!ExponentScreenOrientation.lockPlatformAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'lockPlatformAsync');
  }

  const {screenOrientationConstantAndroid, screenOrientationArrayIOS} = options;
  let platformOrientationParam;
  if (Platform.OS === 'android' && screenOrientationConstantAndroid) {
    if (isNaN(screenOrientationConstantAndroid)){
      throw new TypeError(`lockPlatformAsync Android platform: screenOrientationConstantAndroid cannot be called with ${screenOrientationConstantAndroid}`);
    }
    platformOrientationParam = screenOrientationConstantAndroid;
  } else if (Platform.OS === 'ios' && screenOrientationArrayIOS){
    if (!Array.isArray(screenOrientationArrayIOS)){
      throw new TypeError(`lockPlatformAsync iOS platform: screenOrientationArrayIOS cannot be called with ${screenOrientationArrayIOS}`);
    }
    for (let orientation of screenOrientationArrayIOS){
      const orientations = Object.values(Orientation);
      if (!orientations.includes(orientation)) {
        throw new TypeError(`lockPlatformAsync iOS platform: ${orientation} is not a valid Orientation`);
      }
    }
    platformOrientationParam = screenOrientationArrayIOS;
  }
  await ExponentScreenOrientation.lockPlatformAsync(platformOrientationParam);
}

export async function unlockAsync(): Promise<void> {
  if (!ExponentScreenOrientation.unlockAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'unlockAsync');
  }
  await ExponentScreenOrientation.unlockAsync();
}

export async function getOrientationAsync(): Promise<OrientationInfo> {
  if (!ExponentScreenOrientation.getOrientationAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'getOrientationAsync');
  }
  if (Platform.OS === 'ios'){
    return await ExponentScreenOrientation.getOrientationAsync();
  } else {
    return {
      orientation: await ExponentScreenOrientation.getOrientationAsync(),
    }
  }
}

export async function getOrientationLockAsync(): Promise<OrientationLock> {
  if (!ExponentScreenOrientation.getOrientationLockAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'getOrientationLockAsync');
  }
  return await ExponentScreenOrientation.getOrientationLockAsync();
}

export async function getPlatformOrientationLockAsync(): Promise<PlatformInfo> {
  const platformOrientationLock = await ExponentScreenOrientation.getPlatformOrientationLockAsync();
  if (Platform.OS === 'android'){
    return {
      screenOrientationConstantAndroid: platformOrientationLock,
    };
  } else if (Platform.OS === 'ios'){
    return {
      screenOrientationArrayIOS: platformOrientationLock,
    };
  } else {
    throw new UnavailabilityError('ScreenOrientation', 'getPlatformOrientationLockAsync');
  }
}

export async function supportsOrientationLockAsync(orientationLock: OrientationLock): Promise<boolean> {
  if (!ExponentScreenOrientation.supportsOrientationLockAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'supportsOrientationLockAsync');
  }

  const orientationLocks = Object.values(OrientationLock);
  if (!orientationLocks.includes(orientationLock)){
    throw new TypeError(`Invalid Orientation Lock: ${orientationLock}`);
  }

  return await ExponentScreenOrientation.supportsOrientationLockAsync(orientationLock);
}

export async function doesSupportAsync(orientationLock: OrientationLock): Promise<boolean> {
  return await supportsOrientationLockAsync(orientationLock);
}

// We rely on RN to emit `didUpdateDimensions`
// If this method no longer works, it's possible that the underlying RN implementation has changed
// see https://github.com/facebook/react-native/blob/c31f79fe478b882540d7fd31ee37b53ddbd60a17/ReactAndroid/src/main/java/com/facebook/react/modules/deviceinfo/DeviceInfoModule.java#L90
export function addOrientationChangeListener(listener: OrientationChangeListener): EmitterSubscription {
  if (typeof listener !== 'function'){
    throw new TypeError(`addOrientationChangeListener cannot be called with ${listener}`);
  }

  const eventName = Platform.OS === 'ios' ? 'expoDidUpdateDimensions' : 'didUpdateDimensions';
  const subscription = _orientationChangeEmitter.addListener(eventName, async update => {
    let orientationInfo, orientationLock;
    if (Platform.OS === 'ios'){
      // RN relies on statusBarOrientation (deprecated) to emit `didUpdateDimensions` event, so we emit our own `expoDidUpdateDimensions` event instead
      orientationLock = update.orientationLock;
      orientationInfo = update.orientationInfo;
    } else {
      // We rely on the RN Dimensions to emit the `didUpdateDimensions` event on Android
      let orientation;
      [orientationLock, orientation] = await Promise.all([ExponentScreenOrientation.getOrientationLockAsync(), ExponentScreenOrientation.getOrientationAsync()])
      orientationInfo = {orientation};
    }
    listener ({orientationInfo, orientationLock});
  });
  _orientationChangeSubscribers.push(subscription);

  return subscription;
}

export function removeOrientationChangeListeners(): void {
  // Remove listener by subscription instead of eventType to avoid clobbering Dimension module's subscription of didUpdateDimensions
  let i = _orientationChangeSubscribers.length;
  while (i--) {
    const subscriber = _orientationChangeSubscribers[i];
    subscriber.remove();

    // remove after a successful unsuscribe
    _orientationChangeSubscribers.pop(); 
  }
}

export function removeOrientationChangeListener(subscription: EmitterSubscription): void {
  // TODO: better way to check for valid subscription?
  if (!subscription || !subscription.remove){
    throw new TypeError(`Must pass in a valid subscription`);
  }
  subscription.remove();
  _orientationChangeSubscribers = _orientationChangeSubscribers.filter(sub => sub !== subscription);
}
