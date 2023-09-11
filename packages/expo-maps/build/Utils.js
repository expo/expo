import { Asset } from 'expo-asset';
import React from 'react';
export function isSimpleType(child) {
    return (typeof child == 'string' ||
        typeof child == 'boolean' ||
        typeof child == 'number' ||
        child === null ||
        child === undefined);
}
export function isPolygon(child) {
    if ('type' in child && String(child.type).includes('Polygon') && 'props' in child) {
        const props = Object.keys(child.props);
        if (props.includes('points')) {
            return true;
        }
    }
    return false;
}
export function isPolyline(child) {
    if ('type' in child && String(child.type).includes('Polyline') && 'props' in child) {
        const props = Object.keys(child.props);
        if (props.includes('points')) {
            return true;
        }
    }
    return false;
}
export function isOverlay(child) {
    if ('type' in child && String(child.type).includes('Overlay') && 'props' in child) {
        const props = Object.keys(child.props);
        if (props.includes('bounds') && props.includes('icon')) {
            return true;
        }
    }
    return false;
}
export function isCircle(child) {
    if ('type' in child && String(child.type).includes('Circle') && 'props' in child) {
        const props = Object.keys(child.props);
        if (props.includes('center') && props.includes('radius')) {
            return true;
        }
    }
    return false;
}
export function isMarker(child) {
    if ('type' in child && String(child.type).includes('Marker') && 'props' in child) {
        const props = Object.keys(child.props);
        if (props.includes('latitude') && props.includes('longitude')) {
            return true;
        }
    }
    return false;
}
export function isCluster(child) {
    if ('type' in child && String(child.type).includes('Cluster') && 'props' in child) {
        const props = Object.keys(child.props);
        if (props.includes('name')) {
            return true;
        }
    }
    return false;
}
export function isKML(child) {
    if ('type' in child && String(child.type).includes('KML') && 'props' in child) {
        const props = Object.keys(child.props);
        if (props.includes('filePath')) {
            return true;
        }
    }
    return false;
}
export function isGeoJson(child) {
    if ('type' in child && String(child.type).includes('GeoJson') && 'props' in child) {
        const props = Object.keys(child.props);
        if (props.includes('geoJsonString')) {
            return true;
        }
    }
    return false;
}
export function isHeatmap(child) {
    if ('type' in child && String(child.type).includes('Heatmap') && 'props' in child) {
        const props = Object.keys(child.props);
        if (props.includes('points')) {
            return true;
        }
    }
    return false;
}
export function isHexColor(color) {
    return color.length > 0 && color[0] === '#';
}
export function mapColorToHexColor(color, defaultColor) {
    let defColor = defaultColor;
    if (defColor === undefined)
        defColor = '#000000';
    const colors = {
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
export function warnIfChildIsIncompatible(child) {
    if (typeof child == 'string' || typeof child == 'boolean' || typeof child == 'number') {
        console.warn(`Warning! Child of type ${typeof child} isn't valid ExpoMap child!`);
    }
    else if (child != null && child !== undefined) {
        console.log(child.type);
        console.warn(`Warning! Child of type ${child.type} isn't valid ExpoMap child!`);
    }
}
export function buildGeoJsonObject(child) {
    if (child.props.defaultStyle?.marker?.color !== undefined &&
        !isHexColor(child.props.defaultStyle.marker.color)) {
        child.props.defaultStyle.marker.color = mapColorToHexColor(child.props.defaultStyle?.marker.color, '#ff0000');
    }
    if (child.props.defaultStyle?.polygon?.fillColor !== undefined &&
        !isHexColor(child.props.defaultStyle.polygon.fillColor)) {
        child.props.defaultStyle.polygon.fillColor = mapColorToHexColor(child.props.defaultStyle.polygon.fillColor);
    }
    if (child.props.defaultStyle?.polygon?.strokeColor !== undefined &&
        !isHexColor(child.props.defaultStyle.polygon.strokeColor)) {
        child.props.defaultStyle.polygon.strokeColor = mapColorToHexColor(child.props.defaultStyle.polygon.strokeColor);
    }
    if (child.props.defaultStyle?.polyline?.color !== undefined &&
        !isHexColor(child.props.defaultStyle.polyline.color)) {
        child.props.defaultStyle.polyline.color = mapColorToHexColor(child.props.defaultStyle.polyline.color);
    }
    return {
        type: 'geojson',
        geoJsonString: child.props.geoJsonString,
        defaultStyle: child.props.defaultStyle,
    };
}
export async function buildMarkerObject(child) {
    let iconPath = undefined;
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
    };
    if (markerObject.color !== undefined && !isHexColor(markerObject.color)) {
        markerObject.color = mapColorToHexColor(markerObject.color, '#ff0000');
    }
    return markerObject;
}
export async function buildOverlayObject(child) {
    const iconPath = await Asset.fromModule(child.props.icon).downloadAsync();
    const overlayObject = {
        type: 'overlay',
        bounds: child.props.bounds,
        icon: iconPath.localUri,
    };
    return overlayObject;
}
export function buildPolygonObject(child) {
    const polygonObject = {
        type: 'polygon',
        points: child.props.points,
        fillColor: child.props.fillColor,
        strokeColor: child.props.strokeColor,
        strokeWidth: child.props.strokeWidth,
        strokePattern: child.props.strokePattern,
        jointType: child.props.jointType,
    };
    if (polygonObject.fillColor !== undefined && !isHexColor(polygonObject.fillColor)) {
        polygonObject.fillColor = mapColorToHexColor(polygonObject.fillColor);
    }
    return polygonObject;
}
export function buildPolylineObject(child) {
    const polylineObject = {
        type: 'polyline',
        points: child.props.points,
        color: child.props.color,
        width: child.props.width,
        pattern: child.props.pattern,
        jointType: child.props.jointType,
        capType: child.props.capType,
    };
    if (polylineObject.color !== undefined && !isHexColor(polylineObject.color)) {
        polylineObject.color = mapColorToHexColor(polylineObject.color);
    }
    return polylineObject;
}
export function buildCircleObject(child) {
    return {
        type: 'circle',
        center: child.props.center,
        radius: child.props.radius,
        fillColor: child.props.fillColor,
        strokeColor: child.props.strokeColor,
        strokeWidth: child.props.strokeWidth,
    };
}
export async function buildKMLObject(child) {
    const filePath = await Asset.fromModule(child.props.filePath).downloadAsync();
    return {
        type: 'kml',
        filePath: filePath.localUri,
    };
}
export async function buildClusterObject(child) {
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
        let iconPath = undefined;
        if (child.props.icon !== undefined) {
            iconPath = await Asset.fromModule(child.props.icon).downloadAsync();
        }
        // TODO(@lukmccall): remove any cast
        const clusterPropObjects = await Promise.all(clusterChildrenArray);
        let minimumClusterSize;
        if (child.props.minimumClusterSize !== undefined && child.props.minimumClusterSize > 0) {
            minimumClusterSize = child.props.minimumClusterSize;
        }
        else {
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
        };
        if (clusterObject.color !== undefined && !isHexColor(clusterObject.color)) {
            clusterObject.color = mapColorToHexColor(clusterObject.color, '#ff0000');
        }
        return clusterObject;
    }
    return null;
}
export function buildHeatmapObject(child) {
    return {
        type: 'heatmap',
        points: child.props.points,
        radius: child.props.radius,
        gradient: child.props.gradient,
        opacity: child.props.opacity,
    };
}
//# sourceMappingURL=Utils.js.map