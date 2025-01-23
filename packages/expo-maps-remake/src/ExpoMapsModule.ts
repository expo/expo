import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoMapsModule extends NativeModule {}

export default requireNativeModule<ExpoMapsModule>('ExpoMapsRemake');
