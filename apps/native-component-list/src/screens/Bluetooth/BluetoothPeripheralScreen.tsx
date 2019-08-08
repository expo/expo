import * as Bluetooth from 'expo-bluetooth';
// import {
//   Characteristics,
//   Descriptors,
//   JSONToNative,
//   nativeToJSON,
//   Services,
// } from 'expo-bluetooth-utils';
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
import { Subscription } from '@unimodules/core';

const Characteristics = {};
const Descriptors = {};
const JSONToNative = () => {};
const nativeToJSON = () => {};
const Services = {};

export default class BluetoothPeripheralScreen extends React.Component<any, { peripheral: Bluetooth.Peripheral | null, services: Bluetooth.Service[], sections: any[] }>  {
  static navigationOptions = ({ navigation }: any) => ({
    title: navigation.getParam('peripheral').name,
  });

  state = {
    peripheral: null,
    services: [],
    sections: [],
  };

  async componentDidMount() {
    const peripheral = this.props.navigation.getParam('peripheral');

    this.setState({ peripheral });

    this.subscription = Bluetooth.observeUpdates(({ peripherals, error }) => {
      if (peripheral.id in peripherals) {
        console.log('Updated peripheral', peripherals[peripheral.id]);
        this.setState({ peripheral: peripherals[peripheral.id] });
      }
    });

    // const servicesInfo = await decodePeripheral(peripheral);
    // this.setState({ services: servicesInfo });
  }

  subscription: Subscription | null = null;

  componentWillUnmount() {
    if (this.subscription) this.subscription.remove();
  }

  getPeripheral = (): Bluetooth.Peripheral => {
    const { peripheral } = this.state;
    if (peripheral == null) {
      throw new Error('peripheral is not loaded');
    }
    // @ts-ignore
    return peripheral;
  }

  render() {
    //TODO: Bacon: disconnect button
    const { state, name, uuid, RSSI } = this.getPeripheral();
    const isConnected = state === 'connected';

    return (
      <ScrollView style={styles.container}>
        <DataContainer>
          <DisconnectPeripheralButton name={name} state={state} uuid={uuid} />
        </DataContainer>
        {isConnected && (
          <DataContainer>
            <RSSIButton
              RSSI={RSSI}
              onPress={this.onPress}
              peripheralUUID={uuid}
            />
          </DataContainer>
        )}
        <PeripheralView {...this.state.peripheral} />
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

async function decodePeripheral(peripheral: Bluetooth.Peripheral) {
  const servicesInfo = await Promise.all(
    peripheral.services.map(async (service: Bluetooth.Service) => {
      const characteristics = await Promise.all(
        service.characteristics.map(async (characteristic: Bluetooth.Characteristic) => {
          if (
            characteristic.properties &&
            characteristic.properties.length &&
            characteristic.properties.includes('read')
          ) {
            try {
              const value = await Bluetooth.readCharacteristicAsync({
                peripheralUUID: characteristic.peripheralUUID,
                serviceUUID: characteristic.serviceUUID,
                characteristicUUID: characteristic.uuid,
              });
              if (value) {
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

          const descriptors = await Promise.all(
            characteristic.descriptors.map(async descriptor => {
              try {
                const value = await Bluetooth.readDescriptorAsync({
                  peripheralUUID: characteristic.peripheralUUID,
                  serviceUUID: characteristic.serviceUUID,
                  characteristicUUID: characteristic.uuid,
                  descriptorUUID: descriptor.uuid,
                });
                if (value) {
                  //Bluetooth.getInfoForCharacteristicUUID(uuid).format === 'utf8
                  console.log('ble.descriptor: ', {
                    value,
                    uuid: descriptor.uuid,
                    converted: nativeToJSON(value),
                  });
                }
              } catch ({ message }) {
                console.log('BLEScreen: ' + message);
              }

              return { ...descriptor, info: Descriptors[descriptor.uuid] };
            })
          );
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
        await Bluetooth.disconnectAsync(uuid);
      } else {
        await Bluetooth.connectAsync(uuid);
        connected = true;
      }
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
function RSSIButton({ peripheralUUID, RSSI }: { peripheralUUID: string, RSSI: string }) {
  const [isUpdating, setUpdate ] = React.useState(false);
  
    return (
      <BluetoothListItem
        disabled={isUpdating}
        title={isUpdating ? 'Refreshing RSSI...' : 'Refresh RSSI'}
        onPress={async () => {
          if (isUpdating) {
            return;
          }
          setUpdate(true);
      
          try {
            await Bluetooth.readRSSIAsync(peripheralUUID);
          } catch (error) {
            Alert.alert('RSSI Error!', error.message);
          } finally {
            setUpdate(false);
          }
        }}
        renderAction={() => {
          if (isUpdating) {
            return <ActivityIndicator />;
          }
          return <Text>{RSSI}</Text>;
        }}
      />
    );
}

class PeripheralView extends React.Component {
  render() {
    // const gatt: Bluetooth.PeripheralInterface = this.props.gatt;

    const {
      name,
      uuid,
      canSendWriteWithoutResponse,
      services = [],
      state,
      RSSI,
      discoveryTimestamp,
      advertisementData,
    } = this.props;

    let discoveryDate;
    if (discoveryTimestamp) {
      discoveryDate = new Date(discoveryTimestamp).toISOString();
    }
    return (
      <DataContainer title="Peripheral">
        {name && <BluetoothListItem title="Name" value={name} />}
        <BluetoothListItem title="ID" value={uuid} />
        <BluetoothListItem title="RSSI" value={RSSI} />
        <BluetoothListItem title="Connection State" value={state} />
        {discoveryDate && <BluetoothListItem title="Discovered" value={discoveryDate} />}

        <ItemListView
          data={services}
          renderItem={(item, index) => <ServiceView key={item.id} {...item} />}
        />
      </DataContainer>
    );
  }
}

class ServiceView extends React.Component {
  render() {
    // const gatt: Bluetooth.ServiceInterface = this.props.gatt;

    const {
      isPrimary,
      uuid,
      includedServices = [],
      characteristics = [],
      parsedValue,
      specForGATT = {},
    } = getStaticInfoFromGATT(this.props);

    const priority = isPrimary ? 'Is Primary!' : 'Secondary';
    return (
      <DataContainer title="Service">
        {specForGATT.name && <BluetoothListItem title={'GATT Name'} value={specForGATT.name} />}

        <BluetoothListItem title={'Priority'} value={priority} />
        <BluetoothListItem title={'GATT Number'} value={uuid} />
        <ItemListView
          title={'Characteristics'}
          data={characteristics}
          renderItem={(item, index) => (
            <CharacteristicsView
              style={{ marginBottom: index === characteristics.length - 1 ? 0 : 12 }}
              key={item.id}
              {...item}
            />
          )}
        />
        <ItemListView
          title={'Included Services'}
          data={includedServices}
          renderItem={(item, index) => <ServiceView key={item.id} {...item} />}
        />
      </DataContainer>
    );
  }
}

const DataContainer = ({ title, style, onPress, children }) => (
  <View
    style={[
      title && {
        marginLeft: 12,
        marginTop: 12,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderLeftWidth: 3,
        borderLeftColor: Colors.tintColor,
      },
      style,
    ]}>
    {title && (
      <Text
        onPress={onPress}
        style={[styles.itemText, { fontWeight: 'bold', padding: 16, opacity: 0.7 }]}>
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
    // const gatt: Bluetooth.CharacteristicInterface = this.props.gatt;
    const {
      properties = [],
      uuid,
      descriptors = [],
      value,
      isNotifying,
      parsedValue,
      specForGATT = {},
    } = getStaticInfoFromGATT(this.props);

    const canRead = properties.includes('read');
    const canWrite = properties.includes('write');
    return (
      <DataContainer
        title={canRead ? 'Read' : 'IDK'}
        style={this.props.style}
        onPress={async () => {
          if (!isNotifying && properties.includes('notify')) {
            // await Bluetooth.shouldNotifyDescriptorAsync({
            //   ...getGATTNumbersFromID(this.props.id),
            //   shouldNotify: true,
            // });
          }
          if (canWrite) {
            await Bluetooth.writeCharacteristicAsync({
              ...getGATTNumbersFromID(this.props.id),
              data: JSONToNative('bacon'),
            });
          } else if (canRead) {
            try {
              // if (properties.includes('write')) {
              //   await Bluetooth.writeCharacteristicAsync({
              //     ...getGATTNumbersFromID(this.props.id),
              //     data: JSONToNative('bacon'),
              //   });
              // }

              const some = await Bluetooth.readCharacteristicAsync(
                getGATTNumbersFromID(this.props.id)
              );
              console.log('Update SOME', some);
            } catch (error) {
              Alert.alert('Error!', error.message);
              console.log(error);
            }
          }
        }}>
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
      <DataContainer
        title={'Reload'}
        onPress={async () => {
          try {
            await Bluetooth.writeDescriptorAsync({
              ...getGATTNumbersFromID(gatt.id),
              data: JSONToNative('bacon'),
            });
          } catch (error) {
            console.log('Descriptor reading error', error);
          }
        }}>
        {specForGATT.name && <BluetoothListItem title={'Name'} value={specForGATT.name} />}
        {parsedValue && <BluetoothListItem title={'Value'} value={parsedValue} />}
        {value != null && <BluetoothListItem title={'Raw Value'} value={value} />}
        <BluetoothListItem title={'GATT Number'} value={uuid} />
      </DataContainer>
    );
  }
}

function getGATTNumbersFromID(id) {
  if (!id || id === '') {
    throw new Error('getGATTNumbersFromID(): Cannot get static data for null GATT number');
  }
  const [peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID] = id.split('|');
  return {
    peripheralUUID,
    serviceUUID,
    characteristicUUID,
    descriptorUUID,
  };
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
  let parsedValue = null;
  if (dataSet) {
    // TODO: Bacon: Add format to each data set item. Since this isn't done lets try converting every value to UTF-8

    if (gatt.value != null && dataSet.format === 'utf8') {
      parsedValue = nativeToJSON(gatt.value);
    }

    return {
      ...gatt,
      parsedValue,
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
