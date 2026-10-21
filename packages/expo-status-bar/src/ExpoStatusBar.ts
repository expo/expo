import { requireOptionalNativeModule, type NativeModule } from 'expo';

import type { VerticalBarBehaviorIOS, VerticalBarEdgeIOS } from './types';

type ExpoStatusBarEvents = {
  onVerticalBarEdgeChange(event: { edge: VerticalBarEdgeIOS | null }): void;
};

declare class ExpoStatusBarModule extends NativeModule<ExpoStatusBarEvents> {
  getVerticalBarEdge(): VerticalBarEdgeIOS | null;
  setVerticalBarBehavior(behavior: VerticalBarBehaviorIOS): void;
}

export default requireOptionalNativeModule<ExpoStatusBarModule>('ExpoStatusBar');
