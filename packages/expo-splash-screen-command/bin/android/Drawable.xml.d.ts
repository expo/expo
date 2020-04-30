import { ResizeMode } from '../constants';
/**
 * @param androidMainPath Path to the main directory containing code and resources in Android project. In general that would be `android/app/src/main`.
 * @param resizeMode
 */
export default function configureDrawableXml(androidMainPath: string, resizeMode: ResizeMode): Promise<void>;
