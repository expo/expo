import * as React from 'react';
import { View, ViewStyle, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';

import Colors from '../constants/Colors';
import { SectionLabelText } from './Text';
import { SectionLabelContainer } from './Views';

type Props = {
  style?: ViewStyle;
  title: string;
  buttonLabel?: string;
  leftContent?: React.ReactNode;
  onPress?: () => any;
  onLongPress?: () => any;
};

export default function SectionHeader({
  title,
  buttonLabel,
  onPress,
  onLongPress,
  leftContent,
}: Props) {
  return (
    <SectionLabelContainer>
      <View style={styles.textContainer}>
        {leftContent}
        <SectionLabelText>{title.toUpperCase()}</SectionLabelText>
      </View>
      {buttonLabel && (
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={onPress}
          onLongPress={onLongPress}>
          <Text style={styles.buttonText}>{buttonLabel.toUpperCase()}</Text>
        </TouchableOpacity>
      )}
    </SectionLabelContainer>
  );
}

const styles = StyleSheet.create({
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  buttonText: {
    color: Colors.light.greyText,
    fontSize: 11,
    letterSpacing: 0.92,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
    }),
  },
});
