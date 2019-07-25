import * as React from 'react';
import { Marker as GoogleMapsMarker } from 'react-google-maps';
class Marker extends React.Component {
    render() {
        const { description, title, coordinate } = this.props;
        const markerTitle = description ? `${title}\n${description}` : title;
        const position = { lat: coordinate.latitude, lng: coordinate.longitude };
        return <GoogleMapsMarker title={markerTitle} position={position}/>;
    }
}
export default Marker;
//# sourceMappingURL=Marker.js.map