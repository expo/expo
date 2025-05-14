import React from 'react';
import {StyleSheet, View, Text, Dimensions, ScrollView} from 'react-native';
import MapView, {Marker, Polygon, Polyline, Callout} from 'react-native-maps';
import PriceMarker from './PriceMarker';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
let id = 0;

class Event extends React.Component<any, any> {
  shouldComponentUpdate(nextProps: any) {
    return this.props.event.id !== nextProps.event.id;
  }

  render() {
    const {event} = this.props;
    return (
      <View style={styles.event}>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.eventData}>
          {JSON.stringify(event.data, null, 2)}
        </Text>
      </View>
    );
  }
}

class EventListener extends React.Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      events: [],
    };
  }

  makeEvent(e: any, name: any) {
    return {
      id: id++,
      name,
      data: e.nativeEvent ? e.nativeEvent : e,
    };
  }

  recordEvent(name: any) {
    return (e: any) => {
      if (e.persist) {
        e.persist(); // Avoids warnings relating to https://fb.me/react-event-pooling
      }
      this.setState((prevState: any) => ({
        events: [this.makeEvent(e, name), ...prevState.events.slice(0, 10)],
      }));
    };
  }

  render() {
    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          initialRegion={this.state.region}
          showsUserLocation
          showsMyLocationButton
          onRegionChangeStart={this.recordEvent('Map::onRegionChangeStart')}
          onRegionChange={this.recordEvent('Map::onRegionChange')}
          onRegionChangeComplete={this.recordEvent(
            'Map::onRegionChangeComplete',
          )}
          onPress={this.recordEvent('Map::onPress')}
          onPanDrag={this.recordEvent('Map::onPanDrag')}
          onLongPress={this.recordEvent('Map::onLongPress')}
          onMarkerPress={this.recordEvent('Map::onMarkerPress')}
          onMarkerSelect={this.recordEvent('Map::onMarkerSelect')}
          onMarkerDeselect={this.recordEvent('Map::onMarkerDeselect')}
          onCalloutPress={this.recordEvent('Map::onCalloutPress')}
          onUserLocationChange={this.recordEvent('Map::onUserLocationChange')}>
          <Marker
            coordinate={{
              latitude: LATITUDE + LATITUDE_DELTA / 2,
              longitude: LONGITUDE + LONGITUDE_DELTA / 2,
            }}
          />
          <Marker
            coordinate={{
              latitude: LATITUDE - LATITUDE_DELTA / 2,
              longitude: LONGITUDE - LONGITUDE_DELTA / 2,
            }}
          />
          <Marker
            title="This is a title"
            description="This is a description"
            coordinate={this.state.region}
            onPress={this.recordEvent('Marker::onPress')}
            onSelect={this.recordEvent('Marker::onSelect')}
            onDeselect={this.recordEvent('Marker::onDeselect')}
            onCalloutPress={this.recordEvent('Marker::onCalloutPress')}>
            <PriceMarker amount={99} />
            <Callout
              style={styles.callout}
              onPress={this.recordEvent('Callout::onPress')}>
              <View>
                <Text>Well hello there...</Text>
              </View>
            </Callout>
          </Marker>
          <Polygon
            fillColor={'rgba(255,0,0,0.3)'}
            onPress={this.recordEvent('Polygon::onPress')}
            tappable
            coordinates={[
              {
                latitude: LATITUDE + LATITUDE_DELTA / 5,
                longitude: LONGITUDE + LONGITUDE_DELTA / 4,
              },
              {
                latitude: LATITUDE + LATITUDE_DELTA / 3,
                longitude: LONGITUDE + LONGITUDE_DELTA / 4,
              },
              {
                latitude: LATITUDE + LATITUDE_DELTA / 4,
                longitude: LONGITUDE + LONGITUDE_DELTA / 2,
              },
            ]}
          />
          <Polyline
            strokeColor={'rgba(255,0,0,1)'}
            onPress={this.recordEvent('Polyline::onPress')}
            tappable
            coordinates={[
              {
                latitude: LATITUDE + LATITUDE_DELTA / 5,
                longitude: LONGITUDE - LONGITUDE_DELTA / 4,
              },
              {
                latitude: LATITUDE + LATITUDE_DELTA / 3,
                longitude: LONGITUDE - LONGITUDE_DELTA / 4,
              },
              {
                latitude: LATITUDE + LATITUDE_DELTA / 4,
                longitude: LONGITUDE - LONGITUDE_DELTA / 2,
              },
            ]}
          />
        </MapView>
        <View style={styles.eventList}>
          <ScrollView>
            {this.state.events.map((event: any) => (
              <Event key={event.id} event={event} />
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  callout: {
    width: 60,
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  event: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: 8,
  },
  eventData: {
    fontSize: 10,
    fontFamily: 'courier',
    color: '#555',
  },
  eventName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222',
  },
  eventList: {
    position: 'absolute',
    top: height / 2,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: height / 2,
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  latlng: {
    width: 200,
    alignItems: 'stretch',
  },
  button: {
    width: 80,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
});

export default EventListener;
