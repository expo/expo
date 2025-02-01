import * as AppleTypes from './apple/AppleMaps.types';
import { AppleMapsView } from './apple/AppleMapsView';
import * as GoogleTypes from './google/GoogleMaps.types';
import GoogleMapsModule from './google/GoogleMapsModule';
import { GoogleMapsView } from './google/GoogleMapsView';
import { StreetView as GoogleStreetView } from './google/GoogleStreetView';
export var GoogleMaps;
(function (GoogleMaps) {
    GoogleMaps.requestPermissionsAsync = async () => GoogleMapsModule?.requestPermissionsAsync();
    GoogleMaps.getPermissionsAsync = async () => GoogleMapsModule?.getPermissionsAsync();
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
export * from './shared.types';
//# sourceMappingURL=index.js.map