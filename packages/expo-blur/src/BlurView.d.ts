import { ComponentProps } from 'react';

import BlurViewAndroid from './BlurView.android';
import BlurViewIOS from './BlurView.ios';
import BlurViewWeb from './BlurView.web';

type Narrow<T1, T2> = T1 extends T2 ? T1 : (T2 extends T1 ? T2 : never);
type CommonBlurView = Narrow<Narrow<BlurViewIOS, BlurViewAndroid>, BlurViewWeb>;

export default class BlurView extends React.Component<ComponentProps<typeof CommonBlurView>> {}
