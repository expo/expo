import { requireNativeModule } from 'expo';

import { MapsModule } from './shared.types';

export default requireNativeModule<MapsModule>('ExpoMaps');
