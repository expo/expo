import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Platform } from 'react-native';

import { useTheme } from '../../../common/ThemeProvider';

export default function SearchBar({
  onSubmit,
  onChangeQuery,
  initialValue = '',
}: {
  initialValue?: string;
  onSubmit?: (query: string) => void;
  onChangeQuery?: (query: string) => void;
}) {
  const { theme } = useTheme();
  const [text, setText] = React.useState(initialValue);
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

  return (
    <View style={styles.container}>
      <TextInput
        ref={_textInput}
        placeholder="Search"
        placeholderTextColor={theme.text.quaternary}
        value={text}
        autoCapitalize="none"
        autoCorrect={false}
        underlineColorAndroid={theme.background.default}
        onSubmitEditing={_handleSubmit}
        onChangeText={_handleChangeText}
        style={styles.searchInput}
      />
      <View style={{ width: 50, alignItems: 'center', justifyContent: 'center' }}>
        {text ? (
          <TouchableOpacity
            onPress={_handleClear}
            hitSlop={{ top: 15, left: 10, right: 15, bottom: 15 }}
            style={{ padding: 5 }}>
            <Ionicons name="close" size={25} color={theme.icon.info} />
          </TouchableOpacity>
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
    paddingLeft: Platform.select({ web: 16, default: 5 }),
    marginRight: 5,
    ...Platform.select({
      web: {
        outlineColor: 'transparent',
      },
      default: {},
    }),
  },
});
