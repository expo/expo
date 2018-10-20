import NativeLinearGradientAndroid from './NativeLinearGradient.android';
import NativeLinearGradientIOS from './NativeLinearGradient.ios';

import { ElementProps } from 'react';

type Narrow<T1, T2> = T1 extends T2 ? T1 : (T2 extends T1 ? T2 : never);
type CommonNativeLinearGradient = Narrow<NativeLinearGradientIOS, NativeLinearGradientAndroid>;

export default class NativeLinearGradient extends React.Component<
  ElementProps<CommonNativeLinearGradient>
> {}
