import { requireOptionalNativeModule } from 'expo';

import { GoogleMapsModule } from './GoogleMaps.types';

export default requireOptionalNativeModule<GoogleMapsModule>('ExpoGoogleMaps');
