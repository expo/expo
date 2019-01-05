import * as React from 'react';
import { Marker } from 'react-google-maps';

type Props = {
  description: string | null;
  title: string;
  coordinate: { latitude: number; longitude: number };
};

class MapViewMarker extends React.Component<Props> {
  render() {
    const { description, title, coordinate } = this.props;
    const markerTitle: string = description ? `${title}\n${description}` : title;
    const position = { lat: coordinate.latitude, lng: coordinate.longitude };
    return <Marker title={markerTitle} position={position} />;
  }
}

export default MapViewMarker;
