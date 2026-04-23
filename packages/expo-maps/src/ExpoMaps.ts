import { requireNativeModule } from 'expo';

import type { MapsModule } from './shared.types';

export default requireNativeModule<MapsModule>('ExpoMaps');
