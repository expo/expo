import { Link, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Button, Text, View } from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';

export default function Modal() {
  const searchBarRef = useRef<SearchBarCommands>(null);
  const [searchText, setSearchText] = useState('');
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        gap: 8,
      }}>
      <Stack.Screen>
        <Stack.Header>
          <Stack.Header.SearchBar
            ref={searchBarRef}
            onChangeText={(e) => setSearchText(e.nativeEvent.text)}
          />
        </Stack.Header>
      </Stack.Screen>
      <Text>Modal Search Text: {searchText}</Text>
      <Button title="Clear Search" onPress={() => searchBarRef.current?.setText('')} />
      <Button title="Cancel Search" onPress={() => searchBarRef.current?.cancelSearch()} />
      <Button title="Focus" onPress={() => searchBarRef.current?.focus()} />
      <Link href={`/${searchText || 1234}`}>Go to {searchText || 1234}</Link>
    </View>
  );
}
