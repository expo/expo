import React from 'react';
import { StyleSheet, View, TextInput } from 'react-native';

import { MainText } from '../components/Text';
import Colors from '../constants/Colors';
import { useThemeName } from '../hooks/useThemeName';
import Button from './Button';

type Props = {
  onPress: (url: string) => void;
};
export default ({ onPress }: Props) => {
  const themeName = useThemeName();
  const [textInputUrl, setTextInputUrl] = React.useState('');
  const borderColor = themeName === 'dark' ? Colors.dark.border : Colors.light.border;

  return (
    <View>
      <MainText style={styles.textMarginBottom}>
        Or, enter the URL of a local bundler manually:
      </MainText>
      <TextInput
        style={[styles.urlTextInput, { borderColor }]}
        placeholder="exp://192..."
        placeholderTextColor="#b0b0ba"
        value={textInputUrl}
        onChangeText={text => setTextInputUrl(text)}
      />
      <Button onPress={() => onPress(textInputUrl)} label="Connect to URL" />
    </View>
  );
};

const styles = StyleSheet.create({
  urlTextInput: {
    width: '100%',

    fontSize: 16,
    padding: 8,

    borderWidth: 1,

    borderRadius: 4,
    marginBottom: 8,
  },

  textMarginBottom: {
    marginBottom: 8,
  },
});
