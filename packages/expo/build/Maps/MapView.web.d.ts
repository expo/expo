import React from 'react';
import { GoogleMap } from 'react-google-maps';
import Marker from './Marker';
declare type Props = {
    onRegionChangeComplete: Function | null;
    onPress: Function;
    onRegionChange: Function | null;
    initialRegion: {
        latitude: number;
        longitude: number;
    };
    region: {
        latitude: number;
        longitude: number;
    };
};
declare class MapView extends React.Component<Props> {
    static Marker: typeof Marker;
    googleMap: GoogleMap | null;
    onMapMount: (googleMap: GoogleMap | null) => void;
    onDragEnd: () => void;
    render(): JSX.Element;
}
export default MapView;
