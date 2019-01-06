import React from 'react';
import { FlatList, Animated, Image, Text, StyleSheet, View } from 'react-native';
import * as Bluetooth from 'expo-bluetooth';
import Colors from '../constants/Colors';
import MonoText from '../components/MonoText';
import Button from '../components/Button';

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
