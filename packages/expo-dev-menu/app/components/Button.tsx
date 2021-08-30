import * as React from 'react';
import { StyleSheet } from 'react-native';

import Colors from '../constants/Colors';
import { StyledText } from './Text';
import { TouchableOpacity } from './Touchables';
import { StyledView } from './Views';

type Props = {
  onPress: () => void;
  tittle: string;
};

export default function({ onPress, tittle }: Props) {
  return (
    <TouchableOpacity onPress={onPress}>
      <StyledView
        style={styles.button}
        darkBackgroundColor={Colors.dark.tint}
        lightBackgroundColor={Colors.light.tint}>
        <StyledText lightColor="#fff" darkColor="#fff">
          {tittle}
        </StyledText>
      </StyledView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});
