import React from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default class FontScreen extends React.Component {
  static navigationOptions = {
    title: 'Font',
  };

  render() {
    return (
      <ScrollView style={{ flex: 1 }}>
        <View
          style={{
            paddingVertical: 10,
            paddingHorizontal: 15,
            flexDirection: 'row',
            justifyContent: 'space-between',
            flex: 1,
          }}>
          <MaterialIcons name="airplay" size={25} />
          <MaterialIcons name="airport-shuttle" size={25} />
          <MaterialIcons name="alarm" size={25} />
          <MaterialIcons name="alarm-add" size={25} />
          <MaterialIcons name="alarm-off" size={25} />
          <MaterialIcons name="all-inclusive" size={25} />
        </View>

        <View style={{ paddingVertical: 10, paddingHorizontal: 15 }}>
          <Text style={{ fontFamily: 'space-mono', fontSize: 16 }}>
            Font icons sets and other custom fonts can be loaded from the web
          </Text>
          {Platform.OS === 'ios' ? (
            <Text
              adjustsFontSizeToFit
              style={{
                flex: 1,
                height: 32,
                fontFamily: 'space-mono',
                fontSize: 420,
              }}>
              Custom font with `adjustsFontSizeToFit` on iOS
            </Text>
          ) : null}
        </View>
      </ScrollView>
    );
  }
}
