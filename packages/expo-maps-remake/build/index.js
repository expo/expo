import * as GoogleTypes from './google/GoogleMaps.types';
import { MapView as GoogleMapsView } from './google/GoogleMapsView';
export var GoogleMaps;
(function (GoogleMaps) {
    GoogleMaps.View = GoogleMapsView;
    GoogleMaps.MapType = GoogleTypes.MapType;
    GoogleMaps.MapColorScheme = GoogleTypes.MapColorScheme;
})(GoogleMaps || (GoogleMaps = {}));
export * from './shared.types';
//# sourceMappingURL=index.js.map