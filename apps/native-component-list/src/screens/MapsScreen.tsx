import React from 'react';
import {
  Platform,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  Switch,
} from 'react-native';
import { PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';

import AnimatedMarkers from './Maps/AnimatedMarkers';
import AnimatedNavigation from './Maps/AnimatedNavigation';
import AnimatedViews from './Maps/AnimatedViews';
import BugMarkerWontUpdate from './Maps/BugMarkerWontUpdate';
import CacheURLTiles from './Maps/CacheURLTiles';
import CacheWMSTiles from './Maps/CacheWMSTiles';
import CachedMap from './Maps/CachedMap';
import Callouts from './Maps/Callouts';
import CameraControl from './Maps/CameraControl';
import CustomMarkers from './Maps/CustomMarkers';
import CustomOverlay from './Maps/CustomOverlay';
import CustomTiles from './Maps/CustomTiles';
import DefaultMarkers from './Maps/DefaultMarkers';
import DisplayLatLng from './Maps/DisplayLatLng';
import DraggableMarkers from './Maps/DraggableMarkers';
import EventListener from './Maps/EventListener';
import FitToCoordinates from './Maps/FitToCoordinates';
import FitToSuppliedMarkers from './Maps/FitToSuppliedMarkers';
import GeojsonMap from './Maps/Geojson';
import GradientPolylines from './Maps/GradientPolylines';
import GradientPolylinesFunctional from './Maps/GradientPolylinesFunctional';
import ImageOverlayWithAssets from './Maps/ImageOverlayWithAssets';
import ImageOverlayWithBearing from './Maps/ImageOverlayWithBearing';
import ImageOverlayWithURL from './Maps/ImageOverlayWithURL';
import IndoorMap from './Maps/IndoorMap';
import LegalLabel from './Maps/LegalLabel';
import LiteMapView from './Maps/LiteMapView';
import LoadingMap from './Maps/LoadingMap';
import MapBoundaries from './Maps/MapBoundaries';
import MapKml from './Maps/MapKml';
import MarkerTypes from './Maps/MarkerTypes';
import MassiveCustomMarkers from './Maps/MassiveCustomMarkers';
import OnPoiClick from './Maps/OnPoiClick';
import Overlays from './Maps/Overlays';
import PolygonCreator from './Maps/PolygonCreator';
import PolylineCreator from './Maps/PolylineCreator';
import SetNativePropsOverlays from './Maps/SetNativePropsOverlays';
import StaticMap from './Maps/StaticMap';
import TakeSnapshot from './Maps/TakeSnapshot';
import TestIdMarkers from './Maps/TestIdMarkers';
import ThemeMap from './Maps/ThemeMap';
import ViewsAsMarkers from './Maps/ViewsAsMarkers';
import WMSTiles from './Maps/WMSTiles';
import ZIndexMarkers from './Maps/ZIndexMarkers';

const IOS = Platform.OS === 'ios';
const ANDROID = Platform.OS === 'android';

function makeExampleMapper(useGoogleMaps: boolean) {
  if (useGoogleMaps) {
    return (example: any) => [example[0], [example[1], example[3]].filter(Boolean).join(' ')];
  }
  return (example: any) => example;
}

export default class MapsScreen extends React.Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      Component: DefaultMarkers,
      useGoogleMaps: ANDROID,
    };
  }

  renderExample([Component, title]: any) {
    return (
      <TouchableOpacity
        key={title}
        style={styles.button}
        onPress={() => this.setState({ Component })}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  }

  renderBackButton() {
    return (
      <TouchableOpacity style={styles.back} onPress={() => this.setState({ Component: null })}>
        <Text style={styles.backButton}>&larr;</Text>
      </TouchableOpacity>
    );
  }

  renderGoogleSwitch() {
    return (
      <View>
        <Text>Use GoogleMaps?</Text>
        <Switch
          onValueChange={(value) => this.setState({ useGoogleMaps: value })}
          style={styles.googleSwitch}
          value={this.state.useGoogleMaps}
        />
      </View>
    );
  }

  renderExamples(examples: any) {
    const { Component, useGoogleMaps } = this.state;

    return (
      <View style={styles.container}>
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={styles.scrollview}
          showsVerticalScrollIndicator={false}>
          {IOS && this.renderGoogleSwitch()}
          {examples.map((example: any) => this.renderExample(example))}
        </ScrollView>
        {Component && (
          <View style={{ backgroundColor: '#FFF', ...StyleSheet.absoluteFillObject }}>
            <Component provider={useGoogleMaps ? PROVIDER_GOOGLE : PROVIDER_DEFAULT} />
          </View>
        )}
        {Component && this.renderBackButton()}
      </View>
    );
  }

  render() {
    return this.renderExamples(
      [
        // [<component>, <component description>, <Google compatible>, <Google add'l description>]
        [StaticMap, 'StaticMap', true],
        [ThemeMap, 'ThemeMap', true],
        [DisplayLatLng, 'Tracking Position', true],
        [ViewsAsMarkers, 'Arbitrary Views as Markers', true],
        [EventListener, 'Events', true, '(incomplete)'],
        [MarkerTypes, 'Image Based Markers', true],
        [DraggableMarkers, 'Draggable Markers', true],
        [PolygonCreator, 'Polygon Creator', true],
        [PolylineCreator, 'Polyline Creator', true],
        [GradientPolylines, 'Gradient Polylines', true],
        [GradientPolylinesFunctional, 'Gradient Polylines Functional', true],
        [AnimatedViews, 'Animating with MapViews'],
        [AnimatedMarkers, 'Animated Marker Position'],
        [Callouts, 'Custom Callouts', true],
        [Overlays, 'Circles, Polygons, and Polylines', true],
        [DefaultMarkers, 'Default Markers', true],
        [CustomMarkers, 'Custom Markers', true],
        [TakeSnapshot, 'Take Snapshot', true, '(incomplete)'],
        [CachedMap, 'Cached Map'],
        [LoadingMap, 'Map with loading', true],
        [MapBoundaries, 'Get visible map boundaries', true],
        [FitToSuppliedMarkers, 'Focus Map On Markers', true],
        [FitToCoordinates, 'Fit Map To Coordinates', true],
        [LiteMapView, 'Android Lite MapView'],
        [CustomTiles, 'Custom Tiles', true],
        [WMSTiles, 'WMS Tiles', true],
        [ZIndexMarkers, 'Position Markers with Z-index', true],
        [LegalLabel, 'Reposition the legal label', true],
        [SetNativePropsOverlays, 'Update native props', true],
        [CustomOverlay, 'Custom Overlay Component', true],
        [TestIdMarkers, 'Test ID for Automation', true],
        [MapKml, 'Load Map with KML', true],
        [BugMarkerWontUpdate, "BUG: Marker Won't Update (Android)", true],
        [ImageOverlayWithAssets, 'Image Overlay Component with Assets', true],
        [ImageOverlayWithURL, 'Image Overlay Component with URL', true],
        [ImageOverlayWithBearing, 'Image Overlay with Bearing', true],
        [AnimatedNavigation, 'Animated Map Navigation', true],
        [OnPoiClick, 'On Poi Click', true],
        [IndoorMap, 'Indoor Map', true],
        [CameraControl, 'CameraControl', true],
        [MassiveCustomMarkers, 'MassiveCustomMarkers', true],
        [GeojsonMap, 'Geojson', true],
        [CacheURLTiles, 'CacheURLTiles', true],
        [CacheWMSTiles, 'CacheWMSTiles', true],
      ]
        // Filter out examples that are not yet supported for Google Maps on iOS.
        .filter((example) => ANDROID || (IOS && (example[2] || !this.state.useGoogleMaps)))
        .map(makeExampleMapper(IOS && this.state.useGoogleMaps))
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scrollview: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  button: {
    flex: 1,
    marginTop: 10,
    backgroundColor: 'rgba(220,220,220,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  back: {
    position: 'absolute',
    top: 20,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 12,
    borderRadius: 20,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: { fontWeight: 'bold', fontSize: 30 },
  googleSwitch: { marginBottom: 10 },
});
