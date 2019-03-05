// @flow
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Bluetooth from 'expo-bluetooth';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '../../constants/Colors';

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
 * Extra:
 * - Observe when a device disconnects
 * - Search by name
 *
 * Another Use Case:
 * - @andrioid: Get parked car:
 *   - This has nothing to do with bluetooth, create an example and document this to cut down on questions.
 * - Preserve connection across hot reloads:
 *   - When a developer is testing bluetooth, they may want to keep the bluetooth state. This could however create leaks and inconsistent state design.
 *
 * TODO: Bacon: Change | to _ in uuids
 *
 * List of service UUIDS https://www.bluetooth.com/specifications/gatt/services
 */

/*
 * Use-case: I just want to scan for peripherals, I'll update my UI from within the view.
 *

Bluetooth.startScanningAsync({}, ({ peripheral }) => {

  // Update the view state
  this.setState(({ peripherals }) => {
    const { [peripheral.id]: currentPeripheral = {}, ...others } = peripherals;
    return {
      peripherals: {
        ...others,
        [peripheral.id]: peripheral
      },
    };
  });

});

*/

export default class BluetoothScreen extends React.Component {
  static navigationOptions = {
    title: 'Bluetooth',
  };

  state = {
    peripherals: {},
    isScanning: false,
    centralState: 'unknown',
  };

  async componentDidMount() {
    
    await Bluetooth.requestPermissionAsync();

    this.stateListener = await Bluetooth.observeCentralStateAsync(state => {
      console.log('observeCentralStateAsync', state);
      this.setState({ centralState: state });
    });

    this.subscription = Bluetooth.observeUpdates(({ peripherals }) => {
      // console.log('BLE Screen: observeUpdatesAsync: ', peripherals);
      this.setState(({ peripherals: currentPeripherals }) => {
        return {
          peripherals: {
            ...currentPeripherals,
            ...peripherals,
          },
        };
      });
    });

    // await new Promise(res => setTimeout(res, 10));
    // const SnapChatSpectaclesServiceUUID = '3E400001-B5A3-F393-E0A9-E50E24DCCA9E';
    // const TileServiceUUID = 'FEED';
    // Load in one or more peripherals
    this.setState({ isScanning: true }, async () => {
      this.stopScanningAsync = await Bluetooth.startScanningAsync(
        {
          androidOnlyConnectable: true,
        },
        /* This will query peripherals with a value found in the peripheral's `advertisementData.serviceUUIDs` */
        // serviceUUIDsToQuery: [SnapChatSpectaclesServiceUUID, TileServiceUUID],
        async peripheral => {
          // console.log('Found: ', peripheral);
          const hasName = peripheral.name && peripheral.name !== '';
          if (hasName) {
            // if (Object.values(this.state.peripherals).length > 2) {
            // }
            const name = peripheral.name.toLowerCase();
            const isBacon = name.indexOf('samsung') !== -1; // My computer's name
            if (isBacon) {
              this.setState({ isScanning: false });
              await this.stopScanningAsync();

              setTimeout(async () => {
                const loadedPeripheral = await Bluetooth.loadPeripheralAsync(peripheral);
                console.log('FINISHED!', loadedPeripheral);
                // this.props.navigation.push('BluetoothPeripheralScreen', {
                //   peripheral: loadedPeripheral,
                // });
              }, 100);
            }
          }
        }
      );
    });
  }

  componentWillUnmount() {
    if (this.stopScanningAsync) this.stopScanningAsync();
    if (this.stateListener) this.stateListener.remove();
    if (this.subscription) this.subscription.remove();
  }
  componentWillUpdate() {
    LayoutAnimation.easeInEaseOut();
  }

  onPressInfo = async peripheral => {
    this.props.navigation.push('BluetoothPeripheralScreen', { peripheral });
  };

  stopScanningAsync;

  render() {
    const { centralState, peripherals, isScanning } = this.state;
    const data = Object.values(peripherals)
      .filter(({ name }) => name != null)
      .sort((a, b) => a.discoveryTimestamp > b.discoveryTimestamp);

    // console.log('ANNNND: ', { data });
    const canUseBluetooth = centralState === 'poweredOn';
    const message = canUseBluetooth
      ? 'Now discoverable as a name that Apple probably doesn\'t surface... Maybe "Evan\'s iPhone?"'
      : `Central is in the ${centralState} state. Please power it on`;
    return (
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ marginTop: 26 }}>
            <ScanningItem
              isDisabled={!canUseBluetooth}
              value={isScanning}
              onValueChange={async value => {
                // ExpoBluetooth.enableBluetoothAsync(true)
                if (value && !this.stopScanningAsync) {
                  this.stopScanningAsync = await Bluetooth.startScanningAsync({}, () => {});
                } else {
                  await this.stopScanningAsync();
                  this.stopScanningAsync = null;
                }
                this.setState({ isScanning: value });
              }}
            />
            <Text style={{ marginLeft: 16, marginVertical: 8, fontSize: 14, opacity: 0.6 }}>
              {message}
            </Text>
          </View>
          {data.length > 0 && (
            <View style={{ marginTop: 26 }}>
              <Text style={{ marginLeft: 16, marginVertical: 8, fontSize: 16, opacity: 0.6 }}>
                DEVICES
              </Text>
              <PeripheralsList onPressInfo={this.onPressInfo} data={data} />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
}

class PeripheralsList extends React.Component {
  renderItem = ({ item }) => <Item onPressInfo={this.props.onPressInfo} item={item} />;

  renderSectionHeader = ({ section: { title } }) => <Header title={title} />;

  keyExtractor = (item = {}, index) => `key-${item.id || index}`;

  render() {
    return (
      <FlatList
        ItemSeparatorComponent={() => (
          <View
            style={[
              { height: StyleSheet.hairlineWidth, backgroundColor: '#C7C7C9', marginLeft: 16 },
            ]}
          />
        )}
        data={this.props.data}
        style={styles.list}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
      />
    );
  }
}

class Item extends React.Component {
  state = {
    isConnecting: false,
  };
  onPress = async () => {
    const { item = {} } = this.props;

    console.log('Attempt to connect to: ', item);
    if (item.state === 'disconnected') {
      this.setState({ isConnecting: true });
      try {
        // await Bluetooth.connectAsync(peripheralUUID, {
        //   // timeout: 5000,
        //   onDisconnect(props) {
        //     console.log('IMA Disconnected Peripheral!', props);
        //   },
        // });

        // return;

        const loadedPeripheral = await Bluetooth.loadPeripheralAsync(item);
        console.log({ loadedPeripheral });
      } catch (error) {
        Alert.alert(
          'Connection Unsuccessful',
          `Make sure "${item.name}" is turned on and in range.`
        );
        console.log({ error });
        // console.error(error);
        // alert('Failed: ' + message);
      } finally {
        this.setState({ isConnecting: false });
      }
    } else if (item.state === 'connected') {
      await Bluetooth.disconnectAsync(item.id);
      // this.props.onPressInfo(this.props.item);
    } else {
      alert('unknown state: ' + item.state);
    }
  };

  onPressInfo = () => {
    this.props.onPressInfo(this.props.item);
  };

  getSubtitle = () => {
    if (this.state.isConnecting) {
      return <ActivityIndicator animating />;
    }
    return (
      <Text style={[styles.itemText, { fontSize: 18, opacity: 0.6 }]}>{this.props.item.state}</Text>
    );
  };
  render() {
    const { item = {} } = this.props;
    return (
      <ItemContainer disabled={this.state.isConnecting} onPress={this.onPress}>
        <Text style={styles.itemText}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {this.getSubtitle()}
          <TouchableOpacity style={{ marginLeft: 8 }} onPress={this.onPressInfo}>
            <Ionicons name={'ios-information-circle-outline'} color="#197AFA" size={28} />
          </TouchableOpacity>
        </View>
      </ItemContainer>
    );
  }
}

class ScanningItem extends React.Component {
  render() {
    const { isDisabled } = this.props;
    const title = isDisabled ? 'Bluetooth Scanning is Disabled' : 'Bluetooth Scanning';
    return (
      <ItemContainer
        containerStyle={{ opacity: isDisabled ? 0.8 : 1 }}
        pointerEvents={isDisabled ? 'none' : undefined}>
        <Text style={styles.itemText}>{title}</Text>
        <Switch
          disabled={isDisabled}
          value={this.props.value}
          onValueChange={this.props.onValueChange}
        />
      </ItemContainer>
    );
  }
}

const ItemContainer = ({ children, pointerEvents, containerStyle, style, ...props }) => (
  <TouchableHighlight
    {...props}
    underlayColor={Colors.listItemTouchableHighlight}
    style={[{ backgroundColor: 'white' }, style]}>
    <View pointerEvents={pointerEvents} style={[styles.itemContainer, containerStyle]}>
      {children}
    </View>
  </TouchableHighlight>
);

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

// {peripheral.state === 'connected' && <TouchableOpacity onPress={() => {
//   Bluetooth.disconnectAsync({ uuid: peripheral.id });
// }}>Disconnect</TouchableOpacity>}

const styles = StyleSheet.create({
  container: {
    // paddingVertical: 16,
    flex: 1,
    backgroundColor: '#EFEEF3',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 10,
  },

  itemText: {
    fontSize: 16,
    color: 'black',
  },
  list: {
    flex: 1,
    // paddingHorizontal: 12,
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
  button: {
    marginRight: 16,
  },
});
