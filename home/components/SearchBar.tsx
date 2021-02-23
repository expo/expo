import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, TextInput } from 'react-native';

import Colors from '../constants/Colors';

const SearchBar = (props: {
  value: string;
  updateSearchValue: (text: string) => void;
  placeholder: string;
}) => {
  const slop = Platform.select({ ios: 15, default: 10 });
  const [isFocused, setFocused] = React.useState(false);
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Ionicons
        style={styles.searchIcon}
        name={Platform.select({ ios: 'ios-search', default: 'md-search' })}
        size={22}
        color={!theme.dark ? 'rgba(36, 44, 58, 0.4)' : '#ccc'}
      />
      <TextInput
        value={props.value}
        onChangeText={text => props.updateSearchValue(text)}
        placeholder={props.placeholder}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        underlineColorAndroid={
          isFocused ? Colors.light.tintColor : !theme.dark ? 'rgba(46, 59, 76, 0.10)' : '#888'
        }
        returnKeyType="search"
        placeholderTextColor={!theme.dark ? 'rgba(36, 44, 58, 0.4)' : '#ccc'}
        style={[styles.textInput, theme.dark && { color: '#fff' }]}
      />
      {isFocused && props.value !== '' ? (
        <TouchableOpacity
          style={styles.clearSearchButton}
          hitSlop={{ top: slop, left: slop, right: slop, bottom: slop }}
          onPress={() => props.updateSearchValue('')}>
          <Ionicons
            name={Platform.select({ ios: 'ios-close-circle', default: 'md-close-circle' })}
            size={22}
            color={!theme.dark ? 'rgba(36, 44, 58, 0.4)' : '#ccc'}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'flex-start',
  },
  searchIcon: {
    paddingRight: 4,
  },
  textInput: {
    fontSize: 16,
    flexGrow: 1,
  },
  clearSearchButton: {
    marginLeft: 'auto',
  },
});

export default SearchBar;
