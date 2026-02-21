import type { NativeModule } from 'expo';

export declare class ExpoBrownfieldStateModuleSpec extends NativeModule {
  getSharedState(key: string): any;
  deleteSharedState(key: string): void;
}
