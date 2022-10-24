import CallbacksExample from '../screens/CallbacksExample';
import CirclesExample from '../screens/CirclesExample';
import ControlsExample from '../screens/ControlsExample';
import GeoJsonExample from '../screens/GeoJsonExample';
import GesturesExample from '../screens/GesturesExample';
import GoogleMapsStylingExample from '../screens/GoogleMapsStylingExample';
import HeatmapsExample from '../screens/HeatmapsExample';
import KMLExample from '../screens/KMLExample';
import MapMoveExample from '../screens/MapMoveExample';
import MapTypesExample from '../screens/MapTypesExample';
import MarkersExample from '../screens/MarkersExample';
import OverlaysExample from '../screens/OverlaysExample';
import POIExample from '../screens/POIExample';
import PolygonsExample from '../screens/PolygonsExample';
import PolylinesExample from '../screens/PolylinesExample';
import TrafficExample from '../screens/TrafficExample';

// TODO: Type this better
interface ConcreteExampleScreen {
  name:
    | 'Markers'
    | 'Polygons'
    | 'Polylines'
    | 'Circles'
    | 'Controls'
    | 'Google Maps Styling'
    | 'Gestures'
    | 'Map Types'
    | 'Traffic'
    | 'KML'
    | 'GeoJson'
    | 'Callbacks'
    | 'POI'
    | 'Overlays'
    | 'Heatmaps'
    | 'Map Move';
  screen: (props: any) => JSX.Element;
}

export const CONCRETE_EXAMPLE_SCREENS: ConcreteExampleScreen[] = [
  {
    name: 'Markers',
    screen: MarkersExample,
  },
  {
    name: 'Map Move',
    screen: MapMoveExample,
  },
  {
    name: 'Polygons',
    screen: PolygonsExample,
  },
  {
    name: 'Polylines',
    screen: PolylinesExample,
  },
  {
    name: 'Circles',
    screen: CirclesExample,
  },
  {
    name: 'Controls',
    screen: ControlsExample,
  },
  {
    name: 'Google Maps Styling',
    screen: GoogleMapsStylingExample,
  },
  {
    name: 'Gestures',
    screen: GesturesExample,
  },
  {
    name: 'Map Types',
    screen: MapTypesExample,
  },
  {
    name: 'Traffic',
    screen: TrafficExample,
  },
  {
    name: 'KML',
    screen: KMLExample,
  },
  {
    name: 'GeoJson',
    screen: GeoJsonExample,
  },
  {
    name: 'Callbacks',
    screen: CallbacksExample,
  },
  {
    name: 'POI',
    screen: POIExample,
  },
  {
    name: 'Overlays',
    screen: OverlaysExample,
  },
  {
    name: 'Heatmaps',
    screen: HeatmapsExample,
  },
];
