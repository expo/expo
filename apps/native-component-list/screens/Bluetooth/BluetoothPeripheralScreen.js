// @flow
import * as Bluetooth from 'expo-bluetooth';
import { Characteristics, Descriptors, nativeToJSON, Services } from 'expo-bluetooth-utils';
import React from 'react';
import {
  ScrollView,
  Alert,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  ActivityIndicator,
} from 'react-native';

import MonoText from '../../components/MonoText';
import Colors from '../../constants/Colors';
import BluetoothListItem from './BluetoothListItem';

export default class BluetoothPeripheralScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.getParam('peripheral').name,
  });

  state = {
    peripheral: {},
    services: [],
    sections: [],
  };

  async componentDidMount() {
    const peripheral = this.props.navigation.getParam('peripheral');

    this.setState({ peripheral });

    this.subscription = await Bluetooth.observeUpdatesAsync(({ peripherals, error }) => {
      if (peripheral.id in peripherals) {
        this.setState({ peripheral: peripherals[peripheral.id] });
      }
    });

    const servicesInfo = await decodePeripheral(peripheral);
    this.setState({ services: servicesInfo });
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.remove();
  }

  render() {
    //TODO: Bacon: disconnect button
    const { state, name, uuid } = this.state.peripheral;
    const isConnected = state === 'connected';

    return (
      <ScrollView style={styles.container}>
        <DataContainer>
          <DisconnectPeripheralButton name={name} state={state} uuid={uuid} />
        </DataContainer>
        <PeripheralView gatt={this.state.peripheral} />
        <MonoText
          containerStyle={{
            borderWidth: 0,
            flex: 1,
            marginVertical: 8,
            paddingVertical: 18,
            paddingLeft: 12,
          }}>
          {JSON.stringify(this.state.peripheral, null, 2)}
        </MonoText>
      </ScrollView>
    );
  }
}

class ItemContainer extends React.Component {
  render() {
    const { children, pointerEvents, containerStyle, style, ...props } = this.props;

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
}

async function decodePeripheral(peripheral) {
  // console.log("BATMAN", {peripheral});
  const servicesInfo = await Promise.all(
    peripheral.services.map(async service => {
      console.log('ROBIN', service);
      const characteristics = await Promise.all(
        service.characteristics.map(async characteristic => {
          if (
            characteristic.properties &&
            characteristic.properties.length &&
            characteristic.properties.indexOf('read') > -1
          ) {
            try {
              const {
                characteristic: { value },
              } = await Bluetooth.readAsync({
                peripheralUUID: characteristic.peripheralUUID,
                serviceUUID: characteristic.serviceUUID,
                characteristicUUID: characteristic.uuid,
                characteristicProperties: Bluetooth.CharacteristicProperty.read, // read
              });
              if (value && value !== '') {
                //Bluetooth.getInfoForCharacteristicUUID(uuid).format === 'utf8
                console.log('ble: ', {
                  value,
                  uuid: characteristic.uuid,
                  converted: nativeToJSON(value),
                });
              }
            } catch ({ message }) {
              console.log('BLEScreen: ' + message);
            }
          }

          const descriptors = characteristic.descriptors.map(descriptor => {
            return { ...descriptor, info: Descriptors[descriptor.uuid] };
          });
          return { ...characteristic, descriptors, info: Characteristics[characteristic.uuid] };
        })
      );
      return { ...service, characteristics, info: Services[service.uuid] };
    })
  );

  return servicesInfo;
}

class DisconnectPeripheralButton extends React.Component {
  state = {
    isConnecting: false,
  };

  onPress = async () => {
    const { uuid, state } = this.props;
    this.setState({ isConnecting: true });

    let connected = false;
    try {
      if (state === 'connected') {
        await Bluetooth.disconnectAsync({ uuid });
      } else {
        await Bluetooth.connectAsync({ uuid });
        connected = true;
      }

      // console.log({ loadedPeripheral });
    } catch (error) {
      Alert.alert(
        'Connection Unsuccessful',
        `Make sure "${this.props.name}" is turned on and in range.`
      );
      console.log({ error });
      // console.error(error);
      // alert('Failed: ' + message);
    } finally {
      this.setState({ isConnecting: false });
      if (connected) {
        this.loadDataAsync();
      }
    }
  };

  loadDataAsync = async () => {
    try {
      await Bluetooth.loadPeripheralAsync({
        id: this.props.uuid,
      });
    } catch (error) {
      Alert.alert('Loading Failed', error.message);
      console.log({ error });
    }
  };

  render() {
    const title = this.props.state === 'connected' ? 'Disconnect' : 'Connect';
    return (
      <BluetoothListItem
        title={title}
        onPress={this.onPress}
        renderAction={() => {
          if (this.state.isConnecting) {
            return <ActivityIndicator />;
          }
          return null;
        }}
      />
    );
  }
}

class PeripheralView extends React.Component {
  render() {
    const gatt: Bluetooth.PeripheralInterface = this.props.gatt;

    const {
      name,
      uuid,
      canSendWriteWithoutResponse,
      services = [],
      state,
      rssi,
      discoveryTimestamp,
      advertisementData,
    } = gatt;

    let discoveryDate;
    if (discoveryTimestamp) {
      discoveryDate = new Date(discoveryTimestamp).toISOString();
    }
    return (
      <DataContainer title="Peripheral">
        {name && <BluetoothListItem title="Name" value={name} />}
        <BluetoothListItem title="ID" value={uuid} />
        <BluetoothListItem title="RSSI" value={rssi} />
        <BluetoothListItem title="Connection State" value={state} />
        {discoveryDate && <BluetoothListItem title="Discovered" value={discoveryDate} />}

        <ItemListView
          data={services}
          renderItem={(item, index) => <ServiceView key={item.id} gatt={item} />}
        />
      </DataContainer>
    );
  }
}

class ServiceView extends React.Component {
  render() {
    const gatt: Bluetooth.ServiceInterface = this.props.gatt;

    const {
      isPrimary,
      uuid,
      includedServices = [],
      characteristics = [],
      parsedValue,
      specForGATT = {},
    } = getStaticInfoFromGATT(gatt);

    const priority = isPrimary ? 'Is Primary!' : 'Secondary';
    return (
      <DataContainer title="Service">
        {specForGATT.name && <BluetoothListItem title={'GATT Name'} value={specForGATT.name} />}

        <BluetoothListItem title={'Priority'} value={priority} />
        <BluetoothListItem title={'GATT Number'} value={uuid} />
        <ItemListView
          title={'Characteristics'}
          data={characteristics}
          renderItem={(item, index) => <CharacteristicsView key={item.id} gatt={item} />}
        />
        <ItemListView
          title={'Included Services'}
          data={includedServices}
          renderItem={(item, index) => <ServiceView key={item.id} gatt={item} />}
        />
      </DataContainer>
    );
  }
}

const DataContainer = ({ title, children }) => (
  <View
    style={
      title && {
        marginLeft: 12,
        marginTop: 12,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderLeftWidth: 3,
        borderLeftColor: Colors.tintColor,
      }
    }>
    {title && (
      <Text style={[styles.itemText, { fontWeight: 'bold', padding: 16, opacity: 0.7 }]}>
        {title}
      </Text>
    )}
    {children}
  </View>
);

class ItemListView extends React.Component {
  render() {
    const { title, data, renderItem, style } = this.props;
    if (data.length === 0) {
      return null;
    }
    return (
      <DataContainer title={title}>
        {data.map((item, index) => renderItem(item, index))}
      </DataContainer>
    );
  }
}

class CharacteristicsView extends React.Component {
  render() {
    const gatt: Bluetooth.CharacteristicInterface = this.props.gatt;
    const {
      properties = [],
      uuid,
      descriptors = [],
      value,
      isNotifying,
      parsedValue,
      specForGATT = {},
    } = getStaticInfoFromGATT(gatt);

    return (
      <DataContainer>
        {specForGATT.name && <BluetoothListItem title={'Name'} value={specForGATT.name} />}
        {!specForGATT.name && <BluetoothListItem title={'GATT Number'} value={uuid} />}
        {parsedValue && <BluetoothListItem title={'Value'} value={parsedValue} />}
        {value && <BluetoothListItem title={'Raw Value'} value={value} />}
        {isNotifying && <BluetoothListItem title={'isNotifying'} value={isNotifying} />}
        {specForGATT.format && (
          <BluetoothListItem title={'Decoding Format'} value={specForGATT.format} />
        )}
        {properties.length && <BluetoothListItem title={'Properties'} values={properties} />}
        <ItemListView
          title={'Descriptors'}
          data={descriptors}
          renderItem={(item, index) => <DescriptorsView key={item.id} gatt={item} />}
        />
      </DataContainer>
    );
  }
}

class DescriptorsView extends React.Component {
  render() {
    const gatt: Bluetooth.DescriptorInterface = this.props.gatt;
    const { uuid, value, parsedValue, specForGATT = {} } = getStaticInfoFromGATT(gatt);

    return (
      <DataContainer>
        {specForGATT.name && <BluetoothListItem title={'Name'} value={specForGATT.name} />}
        {parsedValue && <BluetoothListItem title={'Value'} value={parsedValue} />}
        {value && <BluetoothListItem title={'Raw Value'} value={value} />}
        {specForGATT.format && (
          <BluetoothListItem title={'Decoding Format'} value={specForGATT.format} />
        )}
        <BluetoothListItem title={'GATT Number'} value={uuid} />
      </DataContainer>
    );
  }
}

function getStaticDataFromGATT({ id }) {
  if (!id || id === '') {
    throw new Error('getStaticDataFromGATT(): Cannot get static data for null GATT number');
  }
  const inputValues = [{}, Services, Characteristics, Descriptors];
  const components = id.split('|');
  const dataSet = inputValues[components.length - 1];
  return dataSet[components[components.length - 1]];
}

function getStaticInfoFromGATT(gatt) {
  const dataSet = getStaticDataFromGATT(gatt);
  if (dataSet && gatt.value) {
    // TODO: Bacon: Add format to each data set item. Since this isn't done lets try converting every value to UTF-8

    const convertedValue = nativeToJSON(gatt.value);

    return {
      ...gatt,
      parsedValue: convertedValue,
      specForGATT: dataSet,
    };
  }
  return gatt;
}

const styles = StyleSheet.create({
  container: {
    // paddingVertical: 16,
    flex: 1,
    backgroundColor: '#EFEEF3',
  },
  inset: {
    marginLeft: 12,
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
