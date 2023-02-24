import React from 'react';
import { Point } from './Common.types';
/**
 * Marker specific props.
 */
export type BaseMarkerOptions = {
    /**
     * Id of the marker or cluster, should be unique.
     * If no id is specified then marker-related events won't fire for that particular marker or cluster.
     */
    id?: string;
    /**
     * Title of the marker, avaliable in annotation box.
     */
    markerTitle?: string;
    /**
     * Short description of the marker, avaliable in annotation box.
     */
    markerSnippet?: string;
    /**
     * Custom marker icon.
     */
    icon?: string;
    /**
     * Color of a marker when icon is not provided.
     *
     * Accepted formats:
     * * `'#RRGGBB'`
     * * `'#RRGGBBAA'`
     * * `'#RGB'`
     * * `'#RGBA'`
     * * 'red'
     * * 'blue'
     * * 'green'
     * * 'black'
     * * 'white'
     * * 'gray'
     * * 'cyan'
     * * 'magenta'
     * * 'yellow'
     * * 'lightgray'
     * * 'darkgray'
     * * 'grey'
     * * 'aqua'
     * * 'fuchsia'
     * * 'lime'
     * * 'maroon'
     * * 'navy'
     * * 'olive'
     * * 'purple'
     * * 'silver'
     * * 'teal'
     * @default 'red'
     */
    color?: string;
    /**
     * Opacity of a marker's icon, applied both to asset based icon
     * as well as to default marker's icon.
     */
    opacity?: number;
};
export type MarkerOptions = {
    /**
     * If 'true' marker is draggable, clustered markers can't be dragged.
     *
     * @default false
     */
    draggable?: boolean;
    /**
     * Translation of latitude coordinate.
     */
    anchorU?: number;
    /**
     * Translation of longitude coordinate.
     */
    anchorV?: number;
} & BaseMarkerOptions;
/**
 * Props of Marker component of Expo Maps library.
 */
export type MarkerProps = MarkerOptions & Point;
/**
 * Internal JSON object for representing markers in Expo Maps library.
 *
 * See {@link MarkerProps} for more details.
 */
export type MarkerObject = {
    type: 'marker';
} & MarkerOptions & Point;
/**
 * Marker component of Expo Maps library.
 *
 * Draws customizable marker on ExpoMap.
 * This component should be ExpoMap component child to work properly.
 *
 * See {@link MarkerProps} for more details.
 */
export declare class Marker extends React.Component<MarkerProps> {
    render(): null;
}
//# sourceMappingURL=Marker.d.ts.map