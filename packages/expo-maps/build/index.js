import { Platform } from 'react-native';
import * as AppleTypes from './apple/AppleMaps.types';
import AppleMapsModule from './apple/AppleMapsModule';
import { MapView as AppleMapsView } from './apple/AppleMapsView';
import * as GoogleTypes from './google/GoogleMaps.types';
import GoogleMapsModule from './google/GoogleMapsModule';
import { MapView as GoogleMapsView } from './google/GoogleMapsView';
import { StreetView as GoogleStreetView } from './google/GoogleStreetView';
export var GoogleMaps;
(function (GoogleMaps) {
    GoogleMaps.View = GoogleMapsView;
    GoogleMaps.StreetView = GoogleStreetView;
    GoogleMaps.MapType = GoogleTypes.MapType;
    GoogleMaps.MapColorScheme = GoogleTypes.MapColorScheme;
})(GoogleMaps || (GoogleMaps = {}));
export var AppleMaps;
(function (AppleMaps) {
    AppleMaps.View = AppleMapsView;
    AppleMaps.MapType = AppleTypes.MapType;
})(AppleMaps || (AppleMaps = {}));
export const requestPermissionsAsync = async () => {
    return Platform.select({
        ios: AppleMapsModule?.requestPermissionsAsync,
        android: GoogleMapsModule?.requestPermissionsAsync,
    })?.();
};
export const getPermissionsAsync = async () => {
    return Platform.select({
        ios: AppleMapsModule?.getPermissionsAsync,
        android: GoogleMapsModule?.getPermissionsAsync,
    })?.();
};
export * from './shared.types';
//# sourceMappingURL=index.js.map