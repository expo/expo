import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoUIModule extends NativeModule {}

export default requireNativeModule<ExpoUIModule>('ExpoUI');
