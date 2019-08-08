import {Ionicons} from '@expo/vector-icons';
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
import { Subscription } from '@unimodules/core';

export default class BluetoothScreen extends React.Component<any, { isScanning: boolean, peripherals: { [key: string]: Bluetooth.Peripheral }, centralState: Bluetooth.CentralState  }> {
  static navigationOptions = {
    title: 'Bluetooth',
  };

  state = {
    peripherals: {},
    isScanning: false,
    centralState: Bluetooth.CentralState.Unknown,
  };

  subscription: Subscription | null = null;
  stateListener: Subscription | null = null;

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
      const stopScanningAsync = await Bluetooth.startScanningAsync(
        {
          androidOnlyConnectable: true,
        },
        /* This will query peripherals with a value found in the peripheral's `advertisementData.serviceUUIDs` */
        // serviceUUIDsToQuery: [SnapChatSpectaclesServiceUUID, TileServiceUUID],
        async peripheral => {
          // console.log('Found: ', peripheral);
          if (peripheral.name) {
            const name = peripheral.name.toLowerCase();
            const isBacon = name.indexOf('samsung') !== -1; // My phone's name
            if (isBacon) {
              this.setState({ isScanning: false });

              if (stopScanningAsync) {
                await stopScanningAsync();
              }

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

  onPressInfo = async (peripheral: Bluetooth.Peripheral) => {
    this.props.navigation.push('BluetoothPeripheralScreen', { peripheral });
  };

  stopScanningAsync: Bluetooth.CancelScanningCallback | null = null;
  
  render() {
    const { centralState, peripherals, isScanning } = this.state;
    const allPeripherals: Bluetooth.Peripheral[] = Object.values(peripherals);
    const data = allPeripherals.filter(({ name }) => name != null)
      .sort(({ discoveryTimestamp = 0 }, { discoveryTimestamp: discoveryTimestampB = 0 }) => {
        if (discoveryTimestamp > discoveryTimestampB) return 1;
        if (discoveryTimestamp < discoveryTimestampB) return -1;
        return 0;
      });

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
                if (!this.stopScanningAsync && value) {
                  this.stopScanningAsync = await Bluetooth.startScanningAsync({}, () => {});
                } else if (this.stopScanningAsync) {
                  console.log("stopScanningAsync:", this.stopScanningAsync)
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

class PeripheralsList extends React.Component<{ onPressInfo: (peripheral: Bluetooth.Peripheral) => void, data: Bluetooth.Peripheral[] }> {
  renderItem = ({ item }: { item: Bluetooth.Peripheral }) => {
    return <Item onPressInfo={this.props.onPressInfo} peripheral={item} />
  }

  renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => <Header title={title} />;

  keyExtractor = (item: Bluetooth.Peripheral, index: number) => `key-${item.id || index}`;

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
        data={this.props.data.filter(Boolean)}
        style={styles.list}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
      />
    );
  }
}

function Item({ peripheral, onPressInfo }: { peripheral: Bluetooth.Peripheral, onPressInfo: (peripheral: Bluetooth.Peripheral) => void }) {
  const [isConnecting, setConnecting ] = React.useState(false);

  const onPress = async () => {

    console.log('Attempt to connect to: ', peripheral);
    if (peripheral.state === 'disconnected') {
      setConnecting(true);
      try {
        // await Bluetooth.connectAsync(peripheralUUID, {
        //   // timeout: 5000,
        //   onDisconnect(props) {
        //     console.log('IMA Disconnected Peripheral!', props);
        //   },
        // });

        // return;

        const loadedPeripheral = await Bluetooth.loadPeripheralAsync(peripheral);
        console.log({ loadedPeripheral });
      } catch (error) {
        Alert.alert(
          'Connection Unsuccessful',
          `Make sure "${peripheral.name}" is turned on and in range.`
        );
        console.log({ error });
        // console.error(error);
        // alert('Failed: ' + message);
      } finally {
        setConnecting(false);
      }
    } else if (peripheral.state === 'connected') {
      await Bluetooth.disconnectAsync(peripheral.id);
      // this.props.onPressInfo(this.props.item);
    } else {
      alert('unknown state: ' + peripheral.state);
    }
  };

  const getSubtitle = () => {
    if (isConnecting) {
      return <ActivityIndicator animating />;
    }
    
    return (
      <Text style={[styles.itemText, { fontSize: 18, opacity: 0.6 }]}>{peripheral.state}</Text>
    );
  };
  
    return (
      <ItemContainer disabled={isConnecting} onPress={onPress}>
        <Text style={styles.itemText}>{peripheral.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {getSubtitle()}
          <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => onPressInfo(peripheral)}>
            <Ionicons name={'ios-information-circle-outline'} color="#197AFA" size={28} />
          </TouchableOpacity>
        </View>
      </ItemContainer>
    );
  
}

function ScanningItem({ isDisabled, value, onValueChange }: { isDisabled: boolean, value: boolean, onValueChange: (value:boolean) => void }) {
   
    const title = isDisabled ? 'Bluetooth Scanning is Disabled' : 'Bluetooth Scanning';
    return (
      <ItemContainer
        containerStyle={{ opacity: isDisabled ? 0.8 : 1 }}
        pointerEvents={isDisabled ? 'none' : undefined}>
        <Text style={styles.itemText}>{title}</Text>
        <Switch
          disabled={isDisabled}
          value={value}
          onValueChange={onValueChange}
        />
      </ItemContainer>
    );
  
}

function ItemContainer({ children, pointerEvents, containerStyle, style, ...props }: any) { 
  return (
  <TouchableHighlight
    {...props}
    underlayColor={Colors.listItemTouchableHighlight}
    style={[{ backgroundColor: 'white' }, style]}>
    <View pointerEvents={pointerEvents} style={[styles.itemContainer, containerStyle]}>
      {children}
    </View>
  </TouchableHighlight>
);
  }

function Header({ title }: { title: string }) {
  
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{title.toUpperCase()}</Text>
      </View>
    );
  
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
