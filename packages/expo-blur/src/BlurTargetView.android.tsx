import { BlurTargetViewProps } from './BlurView.types';
import { NativeBlurTargetView } from './NativeBlurModule';

export default function BlurTargetView(props: BlurTargetViewProps) {
  return <NativeBlurTargetView {...props} />;
}
