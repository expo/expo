import { ExpoConfig } from '@expo/config-types';
import { AndroidManifest } from './Manifest';
import { ConfigPlugin } from '../Plugin.types';
export declare const withPredictiveBackGesture: ConfigPlugin;
export declare function setPredictiveBackGesture(config: Pick<ExpoConfig, 'android'>, androidManifest: AndroidManifest): AndroidManifest;
export declare function getPredictiveBackGestureValue(config: Pick<ExpoConfig, 'android'>): "false" | "true";
