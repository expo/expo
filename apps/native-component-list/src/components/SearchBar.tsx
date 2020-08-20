import Ionicons from '@expo/vector-icons/build/Ionicons';
import React from 'react';
import { StyleSheet, TextInput, TextStyle, TouchableNativeFeedback, View } from 'react-native';

import { Colors } from '../constants';

export default function SearchBar({
  selectionColor,
  tintColor = Colors.tintColor,
  placeholderTextColor = '#ccc',
  underlineColorAndroid = '#ccc',
  textColor,
  onSubmit,
  onChangeQuery,
}: {
  selectionColor?: string;
  tintColor: string;
  placeholderTextColor?: string;
  underlineColorAndroid?: string;
  textColor?: string;
  onSubmit?: (query: string) => void;
  onChangeQuery?: (query: string) => void;
}) {
  const [text, setText] = React.useState('');
  const _textInput = React.useRef<TextInput>(null);

  React.useEffect(() => {
    requestAnimationFrame(() => {
      _textInput.current?.focus();
    });
  }, []);

  const _handleClear = () => {
    _handleChangeText('');
  };
  const _handleChangeText = (text: string) => {
    setText(text);
    onChangeQuery?.(text);
  };

  const _handleSubmit = () => {
    onSubmit?.(text);
    _textInput.current?.blur();
  };

  let searchInputStyle: TextStyle = {};
  if (textColor) {
    searchInputStyle.color = textColor;
  }

  return (
    <View style={styles.container}>
      <TextInput
        ref={_textInput}
        placeholder="Search"
        placeholderTextColor={placeholderTextColor}
        value={text}
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={selectionColor}
        underlineColorAndroid={underlineColorAndroid}
        onSubmitEditing={_handleSubmit}
        onChangeText={_handleChangeText}
        style={[styles.searchInput, searchInputStyle]}
      />
      <View style={{ width: 50, alignItems: 'center', justifyContent: 'center' }}>
        {text ? (
          <TouchableNativeFeedback
            onPress={_handleClear}
            hitSlop={{ top: 15, left: 10, right: 15, bottom: 15 }}
            style={{ padding: 5 }}
            background={TouchableNativeFeedback.Ripple(tintColor, true)}>
            <Ionicons name="md-close" size={25} color={tintColor} />
          </TouchableNativeFeedback>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    marginBottom: 2,
    paddingLeft: 5,
    marginRight: 5,
  },
});
