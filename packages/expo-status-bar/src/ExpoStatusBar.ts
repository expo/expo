import { requireOptionalNativeModule, type NativeModule } from 'expo';

import type { VerticalBarEdgeIOS } from './types';

type ExpoStatusBarEvents = {
  onVerticalBarEdgeChange(event: { edge: VerticalBarEdgeIOS | null }): void;
};

declare class ExpoStatusBarModule extends NativeModule<ExpoStatusBarEvents> {
  getVerticalBarEdge(): VerticalBarEdgeIOS | null;
}

export default requireOptionalNativeModule<ExpoStatusBarModule>('ExpoStatusBar');
