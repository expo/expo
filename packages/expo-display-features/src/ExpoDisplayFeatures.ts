import { NativeModule, requireNativeModule } from 'expo';

import { DisplayFeature, DisplayFeaturesChangeEvent, Hinge, HingeChangeEvent } from './DisplayFeatures.types';

export const displayFeaturesChangeEventName = 'onDisplayFeaturesChange';
export const hingeChangeEventName = 'onHingeChange';

type ExpoDisplayFeaturesEvents = {
  [displayFeaturesChangeEventName]: (event: DisplayFeaturesChangeEvent) => void;
  [hingeChangeEventName]: (event: HingeChangeEvent) => void;
};

declare class NativeExpoDisplayFeatures extends NativeModule<ExpoDisplayFeaturesEvents> {
  getDisplayFeaturesAsync(): Promise<DisplayFeature[]>;
  getHingeAsync(): Promise<Hinge | null>;
}

export default requireNativeModule<NativeExpoDisplayFeatures>('ExpoDisplayFeatures');
