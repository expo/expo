import * as React from 'react';
import { View, ViewStyle, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';

import Colors from '../constants/Colors';
import { StyledText, SecondaryText } from './Text';
import { StyledView, SecondaryView } from './Views';

// import { SectionLabelContainer } from './Views';

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
    <SecondaryView style={styles.container}>
      <View style={styles.textContainer}>
        {leftContent}
        <SecondaryText style={styles.title}>{title.toUpperCase()}</SecondaryText>
      </View>
      {/* {buttonLabel && (
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={onPress}
          onLongPress={onLongPress}>
          <Text style={styles.buttonText}>{buttonLabel.toUpperCase()}</Text>
        </TouchableOpacity>
      )} */}
    </SecondaryView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 20,
    borderBottomWidth: 1,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  title: {
    letterSpacing: 0.92,
    ...Platform.select({
      ios: {
        fontWeight: '500',
        fontSize: 11,
      },
      android: {
        fontWeight: '400',
        fontSize: 12,
      },
    }),
  },
  //   buttonText: {
  //     color: Colors.light.greyText,
  //     fontSize: 11,
  //     letterSpacing: 0.92,
  //     ...Platform.select({
  //       ios: {
  //         fontWeight: '500',
  //       },
  //     }),
  //   },
});
