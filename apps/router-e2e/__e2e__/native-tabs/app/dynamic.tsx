import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

export default function Dynamic() {
  const [badgeValue, setBadgeValue] = useState('9+');
  const [labelValue, setLabelValue] = useState('Tab 2');

  return (
    <View>
      <NativeTabs.Trigger>
        <NativeTabs.Trigger.Label>{labelValue}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge>{badgeValue}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <TextInput testID="label-input" value={labelValue} onChangeText={setLabelValue} />
      <TextInput testID="badge-input" value={badgeValue} onChangeText={setBadgeValue} />
    </View>
  );
}
