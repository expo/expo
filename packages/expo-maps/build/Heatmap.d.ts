import { ExpoLinearGradient } from 'expo-module-scripts';
import React from 'react';
import { PointWithData } from './Common.types';
/**
 * Props of Heatmap component of Expo Maps library.
 */
export type HeatmapProps = {
    points: PointWithData[];
} & HeatmapOptions;
/**
 * Configuration options for the heatmap.
 */
export type HeatmapOptions = {
    /**
     * The radius of Gaussian blur applied to the points in pixels (optional).
     * @default 20
     */
    radius?: number;
    /**
     * Defines the color theme of the heatmap (optianal).
     *
     * Color locations will correspond to colors for particular values on the heatmap scaled between 0 and 1.
     *
     * @default provider default
     */
    gradient?: ExpoLinearGradient;
    /**
     * Opacity of the heatmap (optional).
     * @default 1
     */
    opacity?: number;
};
/**
 * Internal JSON object for representing marker clusters in Expo Maps library.
 *
 * See {@link ClusterProps} for more detail.
 */
export type HeatmapObject = {
    type: 'heatmap';
    points: PointWithData[];
    radius?: number;
    opacity?: number;
} & HeatmapProps;
/**
 * Heatmap component of Expo Maps library.
 *
 * Displays multiple {@link PointWithData} objects as a heatmap.
 * Providing data with each point is optional; if no data is provided,
 * heatmap will represent density of points on the map.
 *
 * This component should be ExpoMap component child to work properly.
 *
 * See {@link HeatmapProps} to learn more about props.
 */
export declare class Heatmap extends React.Component<HeatmapProps> {
    render(): null;
}
//# sourceMappingURL=Heatmap.d.ts.map