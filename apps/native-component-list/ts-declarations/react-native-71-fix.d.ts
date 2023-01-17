// react-native 0.71 does not export `Constructor` publicly, these 3rd party modules relies on `Constructor` will break from unknown type.
// override types for these modules as workarounds.

declare module '@react-native-community/slider' {
  import type { SliderProps } from '@react-native-community/slider/typings/index';
  import * as React from 'react';
  import * as ReactNative from 'react-native';
  type Constructor<T> = new (...args: any[]) => T;

  class SliderComponent extends React.Component<SliderProps> {}
  const SliderBase: Constructor<ReactNative.NativeMethodsMixin> & typeof SliderComponent;
  class Slider extends SliderBase {}
  export default Slider;
}

declare module '@react-native-segmented-control/segmented-control' {
  import type { SegmentedControlComponent } from '@react-native-segmented-control/segmented-control/index';
  import * as ReactNative from 'react-native';
  type Constructor<T> = new (...args: any[]) => T;

  const SegmentedControlBase: Constructor<ReactNative.NativeMethods> &
    typeof SegmentedControlComponent;
  class SegmentedControl extends SegmentedControlBase {}
  export default SegmentedControl;
}

declare module '@react-native-masked-view/masked-view' {
  import type { MaskedViewProps } from '@react-native-masked-view/masked-view/types/index';
  import * as React from 'react';
  import * as ReactNative from 'react-native';
  type Constructor<T> = new (...args: any[]) => T;

  class MaskedViewComponent extends React.Component<MaskedViewProps> {}
  const MaskedViewBase: Constructor<ReactNative.NativeMethods> & typeof MaskedViewComponent;
  class MaskedView extends MaskedViewBase {}
  export default MaskedView;
}
