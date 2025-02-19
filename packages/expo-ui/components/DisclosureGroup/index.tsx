import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';
import { DisclosureGroupProps } from './index.types';

/**
 * Displays a native DisclosureGroup
 *
 * @remarks
 *  Working on: Android reimplemtation with jetpack compose
 * 
 *
 */


export function DisclosureGroup(props: DisclosureGroupProps) {
  const [open, setOpen] = useState(false);
  useEffect(()=> {
 props.onStateChange && props.onStateChange(open)
  },[open])
  return (
    <View>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        {...props}
        style={{ marginHorizontal: 10, flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <Text style={[{ fontSize: 20, fontWeight: 'bold' }, props.webTitleStyle]}>Widgets</Text>
        <View style={{ position: 'absolute', right: 0 }}>
          <Ionicons
            name={open ? 'chevron-down-outline' : 'chevron-forward-outline'}
            style={{ flex: 1 }}
            size={13}
          />
        </View>
      </TouchableOpacity>
      {open && <View style={{ marginLeft: 15, marginTop: 5 }}>{props.children}</View>}
    </View>
  );
}
