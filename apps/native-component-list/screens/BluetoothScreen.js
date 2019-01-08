import React from 'react';
import { FlatList, Animated, Image, Text, StyleSheet, View } from 'react-native';
import * as Bluetooth from 'expo-bluetooth';
import Colors from '../constants/Colors';
import MonoText from '../components/MonoText';
import Button from '../components/Button';

/*
 * Mango:
 *
 * - Mounting this screen should start scanning for devices right away.
 *   - This should collect all of the available bluetooth devices.
 *   - This should filter out various bluetooth devices that aren't helpful. TODO: Bacon: (No name?)
 *   - Devices should be sorted by discovery time to prevent jumping around.
 * - Display them in a SectionList with one section dedicated to connected devices, and the other for every other device
 * - Each device should have a button to view more info.
 *   - The more info screen should contain a button to disconnect if connected.
 *   - A button to (Forget This Device). Is this possible?
 *   - The ability to rewrite data - example airpods allow for a name change
 *   - A list of known functionality.
 *   - TODO: Bacon: Add more info
 *
 * - If I tap a non-connected device I should be able to attempt a connection.
 *   - If the connection fails (or times-out?) there should be an alert: "Connection Unsuccessful" "Make sure 'name of device' is turned on and in range." "OK"
 * - When a device is connecting it should have an indicator next to it.
 * - Is it possible to get a list of known devices like in the iOS bluetooth settings?
 * - There should be an indicator at the bottom of the list which shows that scanning is in progress
 * - Is it possible to show the discoverable name of the current device (ios settings)
 *
 * - There should be a toast that presents non-intrusive errors like a device disconnecting from us.
 * - There should be an alert for larger errors.
 *
 * - There should be a section dedicated to the manager.
 *   - This section will display the state of the manager.
 *   - There should be a toggle for scanning.
 *   - If possible (on iOS) we should link to Bluetooth in settings.
 *   - On Android we should be able to turn on/off bluetooth
 *
 * Another Use Case:
 * - Get parked car:
 *   - This has nothing to do with bluetooth, create an example and document this to cut down on questions.
 *
 */

export default class BluetoothScreen extends React.Component {
  static navigationOptions = {
    title: 'Bluetooth',
  };

  state = {
    center: {},
    peripherals: {},
    isScanning: false,
  };

  updatePeripheral = peripheral => {
    this.setState(({ peripherals }) => {
      const { [peripheral.id]: currentPeripheral = {}, ...others } = peripherals;
      return {
        peripherals: {
          ...others,
          [peripheral.id]: {
            ...currentPeripheral,
            ...peripheral,
          },
        },
      };
    });
  };

  componentDidMount() {
    this.listener = Bluetooth.addListener(({ event, data }) => {
      if (data.error) {
        console.log(data.error);
        console.warn(data.error.description);
      }

      if (data.center) {
        this.setState(({ center }) => ({ center: data.center }));
      }

      if (data.peripheral) {
        this.updatePeripheral(data.peripheral);
      }

      // if (event === Bluetooth.Events.CENTRAL_DID_DISCOVER_PERIPHERAL_EVENT) {
      //   const { RSSI, central, advertisementData, peripheral } = data;
      // } else if (event === Bluetooth.Events.CENTRAL_DID_CONNECT_PERIPHERAL_EVENT) {
      //   const { RSSI, central, advertisementData, peripheral } = data;
      // } else {
      // }
      console.log('BluetoothScreen: Event: ', event, data);
    });
  }

  componentWillUnmount() {
    if (this.listener) {
      this.listener.remove();
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Button
          title={(this.state.isScanning ? 'Stop' : 'Start') + ' Scanning'}
          onPress={() => {
            if (this.state.isScanning) {
              Bluetooth.stopScanAsync();
            } else {
              Bluetooth.startScanAsync();
            }
            this.setState({ isScanning: !this.state.isScanning });
          }}
        />

        <PeripheralsList data={Object.values(this.state.peripherals).sort((a, b) => a.id > b.id)} />
      </View>
    );
  }
}

class PeripheralsList extends React.Component {
  renderItem = ({ item }) => <Item item={item} />;

  renderSectionHeader = ({ section: { title } }) => <Header title={title} />;

  keyExtractor = (item = {}, index) => `key-${item.id || index}`;

  render() {
    return (
      <FlatList
        data={this.props.data}
        style={styles.list}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
        ListFooterComponent={CannyFooter}
      />
    );
  }
}

function CannyFooter() {
  return <View />;
}

class Item extends React.Component {
  render() {
    const { item = {} } = this.props;
    return (
      <View style={styles.itemContainer}>
        <Button
          style={styles.button}
          title={item.state}
          onPress={async () => {
            if (item.state === 'disconnected') {
              await Bluetooth.connectAsync({ uuid: item.id });
            } else if (item.state === 'connected') {
              await Bluetooth.disconnectAsync({ uuid: item.id });
            }
          }}
        />
        <MonoText containerStyle={styles.itemText}>{JSON.stringify(item, null, 2)}</MonoText>
      </View>
    );
  }
}

class Header extends React.Component {
  render() {
    const { title } = this.props;
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{title.toUpperCase()}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerContainer: {
    alignItems: 'stretch',
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: Colors.greyBackground,
  },
  headerText: {
    color: Colors.tintColor,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    borderWidth: 0,
    flex: 1,
    marginVertical: 8,
    paddingVertical: 18,
    paddingLeft: 12,
  },
  button: {
    marginRight: 16,
  },
});
