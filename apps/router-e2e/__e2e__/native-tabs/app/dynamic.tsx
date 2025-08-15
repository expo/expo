import { Badge, Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

const iconNames =
  process.env.EXPO_OS === 'ios'
    ? (['safari', '0.square', 'hockey.puck', 'hourglass', 'house.and.flag'] as SFSymbol[])
    : process.env.EXPO_OS === 'android'
      ? ['ic_search', 'sym_action_email', 'sym_action_chat', 'sym_call_missed']
      : [];

export default function Dynamic() {
  const [badgeValue, setBadgeValue] = useState('9+');
  const [labelValue, setLabelValue] = useState('Tab 2');
  const [iconName, setIconName] = useState(iconNames[0] ?? '');

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#aff',
        gap: 16,
      }}>
      <NativeTabs.Trigger>
        <Label>{labelValue}</Label>
        <Badge>{badgeValue}</Badge>
        <Icon sf={iconName as SFSymbol} drawable={iconName} />
      </NativeTabs.Trigger>
      <Text style={{ fontSize: 24, fontWeight: 600 }}>Label</Text>
      <TextInput
        testID="label-input"
        value={labelValue}
        onChangeText={setLabelValue}
        style={{
          borderWidth: 1,
          borderColor: '#000',
          borderRadius: 4,
          padding: 8,
          width: 100,
          textAlign: 'center',
        }}
      />
      <Text style={{ fontSize: 24, fontWeight: 600, marginTop: 8 }}>Badge</Text>
      <TextInput
        testID="badge-input"
        value={badgeValue}
        onChangeText={setBadgeValue}
        style={{
          borderWidth: 1,
          borderColor: '#000',
          borderRadius: 4,
          padding: 8,
          width: 100,
          textAlign: 'center',
        }}
      />
      <Text style={{ fontSize: 24, fontWeight: 600, marginTop: 8 }}>Icon</Text>
      <View>
        {iconNames.map((name) => (
          <Button
            key={name}
            disabled={name === iconName}
            title={name}
            onPress={() => setIconName(name)}
          />
        ))}
      </View>
    </View>
  );
}
