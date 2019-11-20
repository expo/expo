import React, { ComponentProps } from 'react';

import NativeLinearGradientAndroid from './NativeLinearGradient.android';
import NativeLinearGradientIOS from './NativeLinearGradient.ios';
import NativeLinearGradientWeb from './NativeLinearGradient.web';

type Narrow<T1, T2> = T1 extends T2 ? T1 : T2 extends T1 ? T2 : never;
type CommonNativeLinearGradient = Narrow<
  Narrow<NativeLinearGradientIOS, NativeLinearGradientAndroid>,
  NativeLinearGradientWeb
>;
export default class NativeLinearGradient extends React.Component<
  ComponentProps<typeof CommonNativeLinearGradient> // eslint-disable-line no-undef
> {}
