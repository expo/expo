// @flow
import * as Bluetooth from 'expo-bluetooth';
import { Characteristics, Descriptors, nativeToJSON, Services } from 'expo-bluetooth-utils';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import MonoText from '../../components/MonoText';
import Colors from '../../constants/Colors';

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
              console.error('BLEScreen: ' + message);
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

export default class BluetoothPeripheralScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.getParam('peripheral').name,
  });

  state = {
    services: [],
    sections: [],
  };

  async componentDidMount() {
    const peripheral = this.props.navigation.getParam('peripheral');
    const servicesInfo = await decodePeripheral(peripheral);
    this.setState({ services: servicesInfo });
  }

  render() {
    //TODO: Bacon: disconnect button
    const peripheral = this.props.navigation.getParam('peripheral');

    const { state, uuid } = peripheral;
    const isConnected = state === 'connected';

    return (
      <ScrollView style={styles.container}>
        {isConnected && <DisconnectPeripheralButton uuid={uuid} />}

        {this.state.services.map(item => (
          <ServiceView key={item.id} item={item} />
        ))}

        <MonoText
          containerStyle={{
            borderWidth: 0,
            flex: 1,
            marginVertical: 8,
            paddingVertical: 18,
            paddingLeft: 12,
          }}>
          {JSON.stringify(peripheral, null, 2)}
        </MonoText>
      </ScrollView>
    );
  }
}

class DisconnectPeripheralButton extends React.Component {
  onPress = () => {
    const { uuid } = this.props;
    Bluetooth.disconnectAsync({ uuid });
  };

  render() {
    return (
      <TouchableOpacity onPress={this.onPress}>
        <Text>Disconnect</Text>
      </TouchableOpacity>
    );
  }
}

class ServiceView extends React.Component {
  render() {
    const item: Bluetooth.ServiceInterface = this.props.item;
    const { isPrimary, uuid, includedServices = [], characteristics = [] } = item;
    console.log('ServiceView: ', item);
    return (
      <View>
        <Text>{isPrimary ? 'Is Primary!' : 'Secondary'}</Text>
        <Text>UUID: {uuid}</Text>

        {characteristics.map(item => (
          <CharacteristicsView key={item.id} item={item} />
        ))}
        {includedServices.map(item => (
          <ServiceView key={item.id} item={item} />
        ))}
      </View>
    );
  }
}
class CharacteristicsView extends React.Component {
  render() {
    const item: Bluetooth.CharacteristicInterface = this.props.item;
    const { properties = [], descriptors = [], value, isNotifying } = item;
    return (
      <View>
        <Text>Characteristic</Text>
        <ItemContainer>
          <Text>UUID: {item.uuid}</Text>
        </ItemContainer>
        <ItemContainer>
          <Text>Value: {value}</Text>
        </ItemContainer>
        <ItemContainer>
          <Text>isNotifying: {isNotifying}</Text>
        </ItemContainer>
        <View>
          <Text>Properties</Text>
          {properties.map(property => (
            <Text key={item.id + property}>{property}</Text>
          ))}
        </View>
        {descriptors.map((item, index) => (
          <DescriptorsView key={item.id + ' ' + index} item={item} />
        ))}
      </View>
    );
  }
}
class DescriptorsView extends React.Component {
  render() {
    const item: Bluetooth.DescriptorInterface = this.props.item;
    const { uuid, value } = item;
    return (
      <View>
        <Text>Descriptor</Text>
        <ItemContainer>
          <Text>UUID: {uuid}</Text>
        </ItemContainer>

        <ItemContainer>
          <Text>Value: {value}</Text>
        </ItemContainer>
      </View>
    );
  }
}

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
