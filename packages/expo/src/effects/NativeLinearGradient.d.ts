import NativeLinearGradientAndroid from './NativeLinearGradient.android';
import NativeLinearGradientIOS from './NativeLinearGradient.ios';

type Narrow<T1, T2> = T1 extends T2 ? T1 : (T2 extends T1 ? T2 : never);
type NativeLinearGradient = Narrow<NativeLinearGradientIOS, NativeLinearGradientAndroid>;

export default NativeLinearGradient;
