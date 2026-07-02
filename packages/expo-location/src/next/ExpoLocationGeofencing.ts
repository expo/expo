import { requireNativeModule } from 'expo-modules-core';

import { GeofencingModule } from './Geofencing.types';

export default requireNativeModule<GeofencingModule>('ExpoLocationGeofencing');
