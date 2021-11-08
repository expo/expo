import * as Device from 'expo-device';
import * as React from 'react';
import { Button, ScrollView, View, Platform } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

interface DeviceConstant {
  name?: string;
  value?: any;
}

interface DeviceMethod {
  name?: string;
  method: () => Promise<any>;
}

const deviceTypeMap = {
  [Device.DeviceType.UNKNOWN]: 'unknown',
  [Device.DeviceType.PHONE]: 'phone',
  [Device.DeviceType.TABLET]: 'tablet',
  [Device.DeviceType.DESKTOP]: 'desktop',
  [Device.DeviceType.TV]: 'tv',
};

function DeviceConstants({ name, value }: DeviceConstant) {
  return (
    <View style={{ marginBottom: 8 }}>
      <HeadingText>{name}</HeadingText>
      <MonoText> {typeof value === 'boolean' ? String(value) : value}</MonoText>
    </View>
  );
}

function DeviceMethods({ name = '', method }: DeviceMethod) {
  const [value, setValue] = React.useState('');

  const getValueAsync = async () => {
    let value: any;
    try {
      value = await method();
      if (typeof value === 'boolean') {
        value = value.toString();
      } else if (Array.isArray(value)) {
        value = value.join('\n');
      }
    } catch (error) {
      alert(error);
      value = error.message;
    }
    setValue(value);
  };

  return (
    <View style={{ paddingVertical: 8 }}>
      <View style={{ marginBottom: 8 }}>
        <HeadingText>{name}</HeadingText>
        <MonoText>{value}</MonoText>
      </View>
      <Button onPress={getValueAsync} title={name} color={Colors.tintColor} />
    </View>
  );
}

export default function DeviceScreen() {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
      <DeviceConstants name="Device Brand" value={Device.brand} />
      <DeviceConstants name="Device Year" value={Device.deviceYearClass} />
      <DeviceConstants name="Device manufacturer" value={Device.manufacturer} />
      <DeviceConstants name="Device modelName" value={Device.modelName} />
      <DeviceConstants name="Device os name" value={Device.osName} />
      <DeviceConstants name="Device type" value={deviceTypeMap[Device.deviceType!]} />
      <DeviceConstants name="Device total Memory" value={Device.totalMemory} />
      <DeviceConstants name="Device isDevice" value={Device.isDevice} />
      <DeviceConstants name="Device modelId" value={Device.modelId} />
      <DeviceConstants
        name="Device supportedCpuArchitectures"
        value={Device.supportedCpuArchitectures}
      />
      <DeviceConstants name="Device osVersion" value={Device.osVersion} />
      <DeviceConstants name="Device deviceName" value={Device.deviceName} />
      <DeviceConstants name="Device osInternalBuildId" value={Device.osInternalBuildId} />
      {Platform.OS === 'android' && (
        <View>
          <DeviceConstants name="Device osBuildFingerprint" value={Device.osBuildFingerprint} />
          <DeviceConstants name="Device designName" value={Device.designName} />
          <DeviceConstants name="Device osBuildId" value={Device.osBuildId} />
          <DeviceConstants name="Device productName" value={Device.productName} />
          <DeviceConstants name="Device platformApiLevel" value={Device.platformApiLevel} />
        </View>
      )}
      <DeviceMethods
        name="Device deviceType"
        method={async () => deviceTypeMap[await Device.getDeviceTypeAsync()]}
      />
      {Platform.OS === 'android' && (
        <View>
          <DeviceMethods
            name="Device get system features"
            method={Device.getPlatformFeaturesAsync}
          />
          <DeviceMethods name="Device get max memory" method={Device.getMaxMemoryAsync} />
          <DeviceMethods
            name="Device is sideloading enabled"
            method={Device.isSideLoadingEnabledAsync}
          />
        </View>
      )}
      <DeviceMethods
        name="Device is rooted experimental"
        method={Device.isRootedExperimentalAsync}
      />
    </ScrollView>
  );
}
