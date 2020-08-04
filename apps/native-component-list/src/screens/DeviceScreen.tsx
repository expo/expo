import * as Device from 'expo-device';
import React from 'react';
import { Button, ScrollView, View } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

interface DeviceConstant {
  name?: string;
  value?: any;
}

interface DeviceMethod {
  name?: string;
  method?: any;
}

interface State {
  value?: any;
}

class DeviceConstants extends React.Component<DeviceConstant> {
  render() {
    let { name, value } = this.props;
    if (typeof value === 'boolean') {
      return (
        <View style={{ marginBottom: 10 }}>
          <HeadingText>{name}</HeadingText>
          <MonoText> {String(value)}</MonoText>
        </View>
      );
    } else {
      return (
        <View style={{ marginBottom: 10 }}>
          <HeadingText>{name}</HeadingText>
          <MonoText> {value}</MonoText>
        </View>
      );
    }
  }
}

class DeviceMethods extends React.Component<DeviceMethod, State> {
  state = {
    value: '',
  };

  _getValue = async () => {
    let method = this.props.method;
    let value = await method();
    if (typeof value === 'boolean') {
      value = value.toString();
    } else if (Array.isArray(value)) {
      value = value.join('\n');
    }
    this.setState({ value });
  };

  render() {
    let { name } = this.props;
    if (!name) name = '';
    return (
      <View style={{ padding: 10 }}>
        <View style={{ marginBottom: 10 }}>
          <HeadingText>{name}</HeadingText>
          <MonoText> {this.state.value}</MonoText>
        </View>
        <Button onPress={this._getValue} title={name} color="#DCA42D" />
      </View>
    );
  }
}

export default class DeviceScreen extends React.Component {
  static navigationOptions = {
    title: 'Device',
  };

  render() {
    return (
      <ScrollView style={{ padding: 20, flex: 1, margin: 10 }}>
        <DeviceConstants name="Device Brand" value={Device.brand} />
        <DeviceConstants name="Device manufacturer" value={Device.manufacturer} />
        <DeviceConstants name="Device modelName" value={Device.modelName} />
        <DeviceConstants name="Device os name" value={Device.osName} />
        <DeviceConstants name="Device total Memory" value={Device.totalMemory} />
        <DeviceConstants name="Device osBuildFingerprint" value={Device.osBuildFingerprint} />
        <DeviceConstants name="Device isDevice" value={Device.isDevice} />
        <DeviceConstants name="Device modelId" value={Device.modelId} />
        <DeviceConstants
          name="Device supportedCpuArchitectures"
          value={Device.supportedCpuArchitectures}
        />
        <DeviceConstants name="Device designName" value={Device.designName} />
        <DeviceConstants name="Device osBuildId" value={Device.osBuildId} />
        <DeviceConstants name="Device productName" value={Device.productName} />
        <DeviceConstants name="Device platformApiLevel" value={Device.platformApiLevel} />
        <DeviceConstants name="Device osVersion" value={Device.osVersion} />
        <DeviceConstants name="Device deviceName" value={Device.deviceName} />
        <DeviceConstants name="Device osInternalBuildId" value={Device.osInternalBuildId} />
        <DeviceMethods name="Device deviceType" method={Device.getDeviceTypeAsync} />
        <DeviceMethods name="Device get system features" method={Device.getPlatformFeaturesAsync} />
        <DeviceMethods name="Device get max memory" method={Device.getMaxMemoryAsync} />
        <DeviceMethods
          name="Device is sideloading enabled"
          method={Device.isSideLoadingEnabledAsync}
        />
        <DeviceMethods
          name="Device is rooted experimental"
          method={Device.isRootedExperimentalAsync}
        />
      </ScrollView>
    );
  }
}
