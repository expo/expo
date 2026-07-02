import { requireNativeModule } from 'expo-modules-core';

import { GeocodingModule } from './Geocoding.types';

export default requireNativeModule<GeocodingModule>('ExpoLocationGeocoding');
