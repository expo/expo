import { ProxyNativeModule, requireNativeModule } from 'expo-modules-core';
import React from 'react';
import { Platform, findNodeHandle } from 'react-native';

import { CameraMove } from './Common.types';
import { DefaultNativeExpoMapViewProps, ExpoMapState, ExpoMapViewProps } from './Map.types';
import {
  NativeExpoAppleMapsView,
  NativeExpoAppleMapsModule,
  NativeExpoGoogleMapsView,
  NativeExpoGoogleMapsModule,
} from './NativeExpoMapView';
import * as Utils from './Utils';

export { Marker } from './Marker';
export { Polygon } from './Polygon';
export { Polyline } from './Polyline';
export { Circle } from './Circle';
export { Cluster } from './Cluster';
export { KML } from './KML';
export { GeoJson } from './GeoJson';
export { Overlay } from './Overlay';
export { ExpoMapRef } from './Map.types';
export { POICategoryType } from './Map.types';
export { Heatmap } from './Heatmap';
export * from './Events';

const defaultNativeExpoMapViewProps: DefaultNativeExpoMapViewProps = {
  mapType: 'normal',
  showZoomControls: true,
  showCompass: true,
  showMapToolbar: true,
  showMyLocationButton: true,
  showLevelPicker: true,
  enableRotateGestures: false,
  enableScrollGestures: true,
  enableTiltGestures: false,
  enableZoomGestures: true,
  initialCameraPosition: {
    target: {
      latitude: 51.51,
      longitude: 0.13,
    },
    zoom: 4,
    animate: true,
    duration: 1000,
  },
  enableTraffic: false,
  enablePOISearching: false,
  enablePOIs: false,
  enablePOIFilter: [],
  createPOISearchRequest: '',
  clickablePOIs: true,
};

/**
 * Main map component of Expo Maps library.
 *
 * See {@link ExpoMapViewProps} to learn more about props.
 */
export class ExpoMap extends React.Component<ExpoMapViewProps> {
  state: ExpoMapState = {
    markers: [],
    polygons: [],
    polylines: [],
    circles: [],
    clusters: [],
    kmls: [],
    geojsons: [],
    overlays: [],
    heatmaps: [],
  };
  _ismounted = false;
  mapView = React.createRef<ExpoMap>();

  getSearchCompletions(queryFragment: string) {
    const nodeHandle = findNodeHandle(this.mapView.current);
    let nativeModule: ProxyNativeModule;
    if (Platform.OS === 'ios' && this.props.provider === 'apple') {
      nativeModule = NativeExpoAppleMapsModule;
    } else {
      nativeModule = NativeExpoGoogleMapsModule;
    }

    nativeModule
      .getSearchCompletions(nodeHandle, queryFragment)
      .then((response: [string]) => {
        console.log(response);
      })
      .catch((error: Error) => {
        console.log('Error with message: ' + error.message);
      });
  }

  async moveCamera(cameraMove: CameraMove) {
    const nodeHandle = findNodeHandle(this.mapView.current);
    let nativeModule: ProxyNativeModule;
    if (Platform.OS === 'ios' && this.props.provider === 'apple') {
      nativeModule = requireNativeModule('ExpoAppleMaps');
    } else {
      nativeModule = requireNativeModule('ExpoGoogleMaps');
    }
    return nativeModule.moveCamera(nodeHandle, cameraMove);
  }

  componentDidMount() {
    this.mapChildren();
    this._ismounted = true;
  }

  componentWillUnmount() {
    this._ismounted = false;
  }

  componentDidUpdate(_, prevState: ExpoMapState) {
    if (Object.is(this.state, prevState)) {
      this.mapChildren();
    }
  }

  private async mapChildren() {
    const childrenArray = React.Children.map(this.props.children, async (child) => {
      if (!Utils.isSimpleType(child)) {
        if (Utils.isMarker(child)) {
          return Utils.buildMarkerObject(child);
        } else if (Utils.isPolygon(child)) {
          return Utils.buildPolygonObject(child);
        } else if (Utils.isPolyline(child)) {
          return Utils.buildPolylineObject(child);
        } else if (Utils.isCircle(child)) {
          return Utils.buildCircleObject(child);
        } else if (Utils.isKML(child)) {
          return Utils.buildKMLObject(child);
        } else if (Utils.isGeoJson(child)) {
          return Utils.buildGeoJsonObject(child);
        } else if (Utils.isCluster(child)) {
          return Utils.buildClusterObject(child);
        } else if (Utils.isOverlay(child)) {
          return Utils.buildOverlayObject(child);
        } else if (Utils.isHeatmap(child)) {
          return Utils.buildHeatmapObject(child);
        }
        Utils.warnIfChildIsIncompatible(child);
        return null;
      }
      Utils.warnIfChildIsIncompatible(child);
      return null;
    });

    if (childrenArray !== undefined) {
      // TODO(@lukmccall): remove any cast
      const propObjects = await Promise.all(childrenArray as any);
      if (this._ismounted) {
        this.setState({
          markers: propObjects.filter((elem) => elem?.type === 'marker'),
          polygons: propObjects.filter((elem) => elem?.type === 'polygon'),
          polylines: propObjects.filter((elem) => elem?.type === 'polyline'),
          circles: propObjects.filter((elem) => elem?.type === 'circle'),
          clusters: propObjects.filter((elem) => elem?.type === 'cluster'),
          kmls: propObjects.filter((elem) => elem?.type === 'kml'),
          geojsons: propObjects.filter((elem) => elem?.type === 'geojson'),
          overlays: propObjects.filter((elem) => elem?.type === 'overlay'),
          heatmaps: propObjects.filter((elem) => elem?.type === 'heatmap'),
        });
      }
    }
  }

  render() {
    if (Platform.OS === 'ios' && this.props.provider === 'apple') {
      return (
        <NativeExpoAppleMapsView
          {...defaultNativeExpoMapViewProps}
          {...this.props}
          markers={this.state.markers}
          polygons={this.state.polygons}
          polylines={this.state.polylines}
          circles={this.state.circles}
          clusters={this.state.clusters}
          kmls={this.state.kmls}
          geojsons={this.state.geojsons}
          ref={this.mapView}
        />
      );
    }

    let googleMapsJsonStyleString = this.props.googleMapsJsonStyleString
      ? this.props.googleMapsJsonStyleString
      : '';
    if (this.props.enablePOIs === false) {
      if (this.props.googleMapsJsonStyleString) {
        console.warn(
          "Expo Maps enablePOIs prop isn't effective when custom Google Maps map style is active. Please adjust your style manually to disable the POIs. https://developers.google.com/maps/documentation/ios-sdk/poi"
        );
      } else {
        googleMapsJsonStyleString = JSON.stringify([
          {
            featureType: 'poi',
            stylers: [{ visibility: 'off' }],
          },
        ]);
      }
    }

    return (
      <NativeExpoGoogleMapsView
        {...defaultNativeExpoMapViewProps}
        {...this.props}
        googleMapsJsonStyleString={googleMapsJsonStyleString}
        markers={this.state.markers}
        polygons={this.state.polygons}
        polylines={this.state.polylines}
        circles={this.state.circles}
        clusters={this.state.clusters}
        kmls={this.state.kmls}
        geojsons={this.state.geojsons}
        ref={this.mapView}
        overlays={this.state.overlays}
        heatmaps={this.state.heatmaps}
      />
    );
  }
}
