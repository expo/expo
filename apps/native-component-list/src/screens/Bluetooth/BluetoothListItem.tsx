import {Ionicons} from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import Colors from '../../constants/Colors';

export default function BluetoothListItem(props: any) {
  const { title, values, value, renderAction, onPress } = props
  
    const valuesToRender = values || [value];
    const hasSubtitle = valuesToRender && valuesToRender.length && valuesToRender[0] !== undefined;
    return (
      <TouchableHighlight
        disabled={!onPress}
        underlayColor={Colors.listItemTouchableHighlight}
        onPress={() => onPress(props)}>
        <View style={styles.container}>
          <View
            style={{
              maxWidth: '80%',
            }}>
            <Text
              style={[
                styles.title,
                {
                  marginBottom: hasSubtitle ? 4 : 0,
                  fontSize: hasSubtitle ? 14 : 18,
                },
              ]}>
              {title}
            </Text>
            {hasSubtitle &&
              valuesToRender.map((value, index) => {
                const text = typeof value === 'string' ? value : value.text;

                return (
                <Text key={`value-${index}-${text}`} style={[styles.link, value.style]}>
                  {text}
                </Text>
              )})}
          </View>
          {onPress && !renderAction && <ArrowIcon />}
          {renderAction && renderAction()}
        </View>
      </TouchableHighlight>
    );
}

const ArrowIcon = () => (
  <Ionicons size={24} color={Colors.tabIconDefault} name="ios-arrow-forward" />
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    color: Colors.tintColor,
  },
  subtitle: {
    opacity: 0.8,
  },
});
