import * as React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';

import { SecondaryText } from './Text';
import { SecondaryView } from './Views';

type Props = {
  style?: ViewStyle;
  title: string;
  buttonLabel?: string;
  leftContent?: React.ReactNode;
  onPress?: () => any;
  onLongPress?: () => any;
};

export default function SectionHeader({ title, leftContent }: Props) {
  return (
    <SecondaryView style={styles.container}>
      <View style={styles.textContainer}>
        {leftContent}
        <SecondaryText style={styles.title}>{title.toUpperCase()}</SecondaryText>
      </View>
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
});
