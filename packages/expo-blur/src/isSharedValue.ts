// SharedValue type copied from reanimated
import { SharedValue } from './BlurView.types';

export default function isSharedValue<T>(value: number | SharedValue<T>): value is SharedValue<T> {
  return (value as SharedValue<T>).value !== undefined;
}
