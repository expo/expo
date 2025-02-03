import { requireOptionalNativeModule } from 'expo';

import { MapsModule } from '../shared.types';

export default requireOptionalNativeModule<MapsModule>('ExpoAppleMaps');
