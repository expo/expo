import { Asset } from 'expo-asset';
import React from 'react';

import { Circle, CircleObject } from './Circle';
import { Cluster, ClusterObject } from './Cluster';
import { Color } from './Common.types';
import { GeoJson, GeoJsonObject } from './GeoJson';
import { Heatmap, HeatmapObject } from './Heatmap';
import { KML, KMLObject } from './KML';
import { Marker, MarkerObject } from './Marker';
import { Overlay, OverlayObject } from './Overlay';
import { Polygon, PolygonObject } from './Polygon';
import { Polyline, PolylineObject } from './Polyline';

export function isSimpleType(child: any) {
  return (
    typeof child == 'string' ||
    typeof child == 'boolean' ||
    typeof child == 'number' ||
    child === null ||
    child === undefined
  );
}

export function isPolygon(child: any): child is Polygon {
  if ('type' in child && String(child.type).includes('Polygon') && 'props' in child) {
    const props = Object.keys(child.props);
    if (props.includes('points')) {
      return true;
    }
  }
  return false;
}

export function isPolyline(child: any): child is Polyline {
  if ('type' in child && String(child.type).includes('Polyline') && 'props' in child) {
    const props = Object.keys(child.props);
    if (props.includes('points')) {
      return true;
    }
  }
  return false;
}

export function isOverlay(child: any): child is Overlay {
  if ('type' in child && String(child.type).includes('Overlay') && 'props' in child) {
    const props = Object.keys(child.props);
    if (props.includes('bounds') && props.includes('icon')) {
      return true;
    }
  }
  return false;
}

export function isCircle(child: any): child is Circle {
  if ('type' in child && String(child.type).includes('Circle') && 'props' in child) {
    const props = Object.keys(child.props);
    if (props.includes('center') && props.includes('radius')) {
      return true;
    }
  }
  return false;
}

export function isMarker(child: any): child is Marker {
  if ('type' in child && String(child.type).includes('Marker') && 'props' in child) {
    const props = Object.keys(child.props);
    if (props.includes('latitude') && props.includes('longitude')) {
      return true;
    }
  }
  return false;
}

export function isCluster(child: any): child is Cluster {
  if ('type' in child && String(child.type).includes('Cluster') && 'props' in child) {
    const props = Object.keys(child.props);
    if (props.includes('name')) {
      return true;
    }
  }
  return false;
}

export function isKML(child: any): child is KML {
  if ('type' in child && String(child.type).includes('KML') && 'props' in child) {
    const props = Object.keys(child.props);
    if (props.includes('filePath')) {
      return true;
    }
  }
  return false;
}

export function isGeoJson(child: any): child is GeoJson {
  if ('type' in child && String(child.type).includes('GeoJson') && 'props' in child) {
    const props = Object.keys(child.props);
    if (props.includes('geoJsonString')) {
      return true;
    }
  }
  return false;
}

export function isHeatmap(child: any): child is Heatmap {
  if ('type' in child && String(child.type).includes('Heatmap') && 'props' in child) {
    const props = Object.keys(child.props);
    if (props.includes('points')) {
      return true;
    }
  }
  return false;
}

export function isHexColor(color: any): color is Color {
  return color.length > 0 && color[0] === '#';
}

export function mapColorToHexColor(color: Color, defaultColor?: string): string {
  let defColor = defaultColor;
  if (defColor === undefined) defColor = '#000000';

  const colors: Record<Color | 'default', string> = {
    red: '#ff0000',
    blue: '#0000ff',
    green: '#00ff00',
    black: '#000000',
    white: '#ffffff',
    gray: '#808080',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    yellow: '#ffff00',
    lightgray: '#d3d3d3',
    darkgray: '#a9a9a9',
    aqua: '#00ffff',
    fuchsia: '#ca2c92',
    lime: '#bfff00',
    maroon: '#800000',
    navy: '#000080',
    olive: '#808000',
    purple: '#800080',
    silver: '#c0c0c0',
    teal: '#008080',
    default: defColor,
  };

  return colors[color] || colors['default'];
}

export function warnIfChildIsIncompatible(child: any) {
  if (typeof child == 'string' || typeof child == 'boolean' || typeof child == 'number') {
    console.warn(`Warning! Child of type ${typeof child} isn't valid ExpoMap child!`);
  } else if (child != null && child !== undefined) {
    console.log(child.type);
    console.warn(
      `Warning! Child of type ${(child as React.ReactElement<any>).type} isn't valid ExpoMap child!`
    );
  }
}

export function buildGeoJsonObject(child: GeoJson): GeoJsonObject {
  if (
    child.props.defaultStyle?.marker?.color !== undefined &&
    !isHexColor(child.props.defaultStyle.marker.color)
  ) {
    child.props.defaultStyle.marker.color = mapColorToHexColor(
      child.props.defaultStyle?.marker.color as Color,
      '#ff0000'
    );
  }

  if (
    child.props.defaultStyle?.polygon?.fillColor !== undefined &&
    !isHexColor(child.props.defaultStyle.polygon.fillColor)
  ) {
    child.props.defaultStyle.polygon.fillColor = mapColorToHexColor(
      child.props.defaultStyle.polygon.fillColor as Color
    );
  }

  if (
    child.props.defaultStyle?.polygon?.strokeColor !== undefined &&
    !isHexColor(child.props.defaultStyle.polygon.strokeColor)
  ) {
    child.props.defaultStyle.polygon.strokeColor = mapColorToHexColor(
      child.props.defaultStyle.polygon.strokeColor as Color
    );
  }

  if (
    child.props.defaultStyle?.polyline?.color !== undefined &&
    !isHexColor(child.props.defaultStyle.polyline.color)
  ) {
    child.props.defaultStyle.polyline.color = mapColorToHexColor(
      child.props.defaultStyle.polyline.color as Color
    );
  }

  return {
    type: 'geojson',
    geoJsonString: child.props.geoJsonString,
    defaultStyle: child.props.defaultStyle,
  } as GeoJsonObject;
}

export async function buildMarkerObject(child: Marker): Promise<MarkerObject> {
  let iconPath: Asset | undefined = undefined;
  if (child.props.icon !== undefined) {
    iconPath = await Asset.fromModule(child.props.icon).downloadAsync();
  }

  const markerObject = {
    type: 'marker',
    id: child.props.id,
    latitude: child.props.latitude,
    longitude: child.props.longitude,
    markerTitle: child.props.markerTitle,
    markerSnippet: child.props.markerSnippet,
    icon: iconPath?.localUri,
    color: child.props.color,
    draggable: child.props.draggable ? child.props.draggable : false,
    anchorU: child.props.anchorU,
    anchorV: child.props.anchorV,
    opacity: child.props.opacity ? child.props.opacity : 1,
  } as MarkerObject;

  if (markerObject.color !== undefined && !isHexColor(markerObject.color)) {
    markerObject.color = mapColorToHexColor(markerObject.color as Color, '#ff0000');
  }
  return markerObject;
}

export async function buildOverlayObject(child: Overlay): Promise<OverlayObject> {
  const iconPath = await Asset.fromModule(child.props.icon).downloadAsync();

  const overlayObject = {
    type: 'overlay',
    bounds: child.props.bounds,
    icon: iconPath.localUri,
  } as OverlayObject;

  return overlayObject;
}

export function buildPolygonObject(child: Polygon): PolygonObject {
  const polygonObject = {
    type: 'polygon',
    points: child.props.points,
    fillColor: child.props.fillColor,
    strokeColor: child.props.strokeColor,
    strokeWidth: child.props.strokeWidth,
    strokePattern: child.props.strokePattern,
    jointType: child.props.jointType,
  } as PolygonObject;
  if (polygonObject.fillColor !== undefined && !isHexColor(polygonObject.fillColor)) {
    polygonObject.fillColor = mapColorToHexColor(polygonObject.fillColor as Color);
  }
  return polygonObject;
}

export function buildPolylineObject(child: Polyline): PolylineObject {
  const polylineObject = {
    type: 'polyline',
    points: child.props.points,
    color: child.props.color,
    width: child.props.width,
    pattern: child.props.pattern,
    jointType: child.props.jointType,
    capType: child.props.capType,
  } as PolylineObject;
  if (polylineObject.color !== undefined && !isHexColor(polylineObject.color)) {
    polylineObject.color = mapColorToHexColor(polylineObject.color as Color);
  }
  return polylineObject;
}

export function buildCircleObject(child: Circle): CircleObject {
  return {
    type: 'circle',
    center: child.props.center,
    radius: child.props.radius,
    fillColor: child.props.fillColor,
    strokeColor: child.props.strokeColor,
    strokeWidth: child.props.strokeWidth,
  } as CircleObject;
}

export async function buildKMLObject(child: KML): Promise<KMLObject> {
  const filePath = await Asset.fromModule(child.props.filePath).downloadAsync();
  return {
    type: 'kml',
    filePath: filePath.localUri,
  } as KMLObject;
}

export async function buildClusterObject(child: Cluster): Promise<ClusterObject | null> {
  const clusterChildrenArray = React.Children.map(child.props.children, async (clusterChild) => {
    if (!isSimpleType(clusterChild)) {
      if (isMarker(clusterChild)) {
        return buildMarkerObject(clusterChild);
      }
    }
    warnIfChildIsIncompatible(clusterChild);
    return null;
  });

  if (clusterChildrenArray !== undefined) {
    let iconPath: Asset | undefined = undefined;
    if (child.props.icon !== undefined) {
      iconPath = await Asset.fromModule(child.props.icon).downloadAsync();
    }

    // TODO(@lukmccall): remove any cast
    const clusterPropObjects = await Promise.all(clusterChildrenArray as any);
    let minimumClusterSize: number;

    if (child.props.minimumClusterSize !== undefined && child.props.minimumClusterSize > 0) {
      minimumClusterSize = child.props.minimumClusterSize;
    } else {
      minimumClusterSize = 4;
    }

    const clusterObject = {
      type: 'cluster',
      id: child.props.id,
      markers: clusterPropObjects,
      name: child.props.name,
      minimumClusterSize,
      markerTitle: child.props.markerTitle,
      markerSnippet: child.props.markerSnippet,
      icon: iconPath?.localUri,
      color: child.props.color,
      opacity: child.props.opacity ? child.props.opacity : 1,
    } as ClusterObject;

    if (clusterObject.color !== undefined && !isHexColor(clusterObject.color)) {
      clusterObject.color = mapColorToHexColor(clusterObject.color as Color, '#ff0000');
    }
    return clusterObject;
  }
  return null;
}

export function buildHeatmapObject(child: Heatmap): HeatmapObject {
  return {
    type: 'heatmap',
    points: child.props.points,
    radius: child.props.radius,
    gradient: child.props.gradient,
    opacity: child.props.opacity,
  } as HeatmapObject;
}
