import BlurViewAndroid from './BlurView.android';
import BlurViewIOS from './BlurView.ios';

import { ElementProps } from 'react';

type Narrow<T1, T2> = T1 extends T2 ? T1 : (T2 extends T1 ? T2 : never);
type CommonBlurView = Narrow<BlurViewIOS, BlurViewAndroid>;

export default class BlurView extends React.Component<ElementProps<CommonBlurView>> {}
