import * as AppleTypes from './apple/AppleMaps.types';
import { MapView as AppleMapsView } from './apple/AppleMapsView';
import * as GoogleTypes from './google/GoogleMaps.types';
import { MapView as GoogleMapsView } from './google/GoogleMapsView';
import { StreetView as GoogleStreetView } from './google/GoogleStreetView';
export declare namespace GoogleMaps {
    const View: typeof GoogleMapsView;
    const StreetView: typeof GoogleStreetView;
    const MapType: typeof GoogleTypes.MapType;
    type MapType = GoogleTypes.MapType;
    const MapColorScheme: typeof GoogleTypes.MapColorScheme;
    type MapColorScheme = GoogleTypes.MapColorScheme;
    type Marker = GoogleTypes.Marker;
    type CameraPosition = GoogleTypes.CameraPosition;
    type MapUiSettings = GoogleTypes.MapUiSettings;
    type MapProperties = GoogleTypes.MapProperties;
    type MapProps = GoogleTypes.MapProps;
}
export declare namespace AppleMaps {
    const View: typeof AppleMapsView;
    const MapType: typeof AppleTypes.MapType;
    type MapType = AppleTypes.MapType;
    type CameraPosition = AppleTypes.CameraPosition;
    type MapProperties = AppleTypes.MapProperties;
    type MapUiSettings = AppleTypes.MapUiSettings;
    type Marker = AppleTypes.Marker;
}
export * from './shared.types';
//# sourceMappingURL=index.d.ts.map