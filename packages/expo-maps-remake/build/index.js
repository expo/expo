import * as AppleTypes from './apple/AppleMaps.types';
import { MapView as AppleMapsView } from './apple/AppleMapsView';
import * as GoogleTypes from './google/GoogleMaps.types';
import { MapView as GoogleMapsView } from './google/GoogleMapsView';
export var GoogleMaps;
(function (GoogleMaps) {
    GoogleMaps.View = GoogleMapsView;
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