import * as GoogleTypes from './google/GoogleMaps.types';
import { MapView as GoogleMapsView } from './google/GoogleMapsView';
export declare namespace GoogleMaps {
    const View: typeof GoogleMapsView;
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
export * from './shared.types';
//# sourceMappingURL=index.d.ts.map