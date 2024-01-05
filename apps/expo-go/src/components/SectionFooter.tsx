import * as React from 'react';
import { View, ViewStyle, Text } from 'react-native';

import SharedStyles from '../constants/SharedStyles';

type Props = {
  style?: ViewStyle;
  title: string;
};

export default function SectionFooter(props: Props) {
  const { title, style } = props;
  return (
    <View style={[SharedStyles.genericCardDescriptionContainer, style]}>
      <Text style={SharedStyles.genericCardDescriptionText}>{title}</Text>
    </View>
  );
}
