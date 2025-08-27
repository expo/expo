import { NativeModule, requireNativeModule } from 'expo';

import { ExpoCssViewModuleEvents } from './ExpoCssView.types';

declare class ExpoCssViewModule extends NativeModule<ExpoCssViewModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoCssViewModule>('ExpoCssView');
