import { Color, Link, Stack, useRouter } from 'expo-router';
import { Toolbar } from 'expo-router/unstable-toolbar';
import { useRef, useState } from 'react';
import { Button, Text, View } from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';

export default function Modal() {
  const searchBarRef = useRef<SearchBarCommands>(null);
  const [searchText, setSearchText] = useState('');
  const [isTrue, setIsTrue] = useState(false);
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        gap: 8,
      }}>
      <Stack.SearchBar ref={searchBarRef} onChangeText={(e) => setSearchText(e.nativeEvent.text)} />
      <Text>Modal Search Text: {searchText}</Text>
      <Button title="Clear Search" onPress={() => searchBarRef.current?.setText('')} />
      <Button title="Cancel Search" onPress={() => searchBarRef.current?.cancelSearch()} />
      <Button title="Focus" onPress={() => searchBarRef.current?.focus()} />
      <Link href={`/${searchText || 1234}`}>Go to {searchText || 1234}</Link>
      <Toolbar>
        <Toolbar.Button
          sf="map"
          onPress={() => router.push('/modal')}
          // barButtonItemStyle="prominent"
          tintColor={Color.ios.systemBlue}
        />
        <Toolbar.Spacer />
        <Toolbar.Button
          sharesBackground={false}
          sf="safari"
          onPress={() => setIsTrue((p) => !p)}
          selected={isTrue}
        />
        {isTrue && (
          <>
            <Toolbar.Spacer width={20} />
            <Toolbar.Button sf="wave.3.backward" />
          </>
        )}
      </Toolbar>
    </View>
  );
}
