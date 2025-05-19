import * as React from 'react';
import { Text, View, StyleSheet, Image, Button, Platform } from 'react-native';

import { addMultipleGifs, deleteAllGifs, getSingleGif } from './GifManagement';

// those are Giphy.com ID's - they are hardcoded here,
// but if you have Giphy API key - you can use findGifs() from gifFetching.ts
const gifIds = ['YsTs5ltWtEhnq', 'cZ7rmKfFYOvYI', '11BCDu2iUc8Nvhryl7'];

function AppMain() {
  //download all gifs at startup
  React.useEffect(() => {
    (async () => {
      await addMultipleGifs(gifIds);
    })();

    //and unload at the end
    return () => {
      deleteAllGifs();
    };
  }, []);

  //file uri of selected gif
  const [selectedUri, setUri] = React.useState(null);

  const handleSelect = async id => {
    try {
      setUri(await getSingleGif(id));
    } catch (e) {
      console.error("Couldn't load gif", e);
    }
  };

  const unloadAll = () => {
    setUri(null);
    deleteAllGifs();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>See contents of gifManagement.ts</Text>
      <Text style={styles.paragraph}>Select one of the IDs</Text>

      {gifIds.map((item, index) => (
        <Button title={`Gif ${index + 1}`} key={item} onPress={() => handleSelect(item)} />
      ))}

      <Button title="Unload all" onPress={unloadAll} />

      <Text style={styles.paragraph}>Selected URI: {selectedUri || 'none'}</Text>
      {selectedUri != null && <Image style={{ height: 200 }} source={{ uri: selectedUri }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  header: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paragraph: {
    textAlign: 'center',
    marginBottom: 15,
  },
});

function UnsupportedPlatform() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        FileSystem doesn&#39;t support web. Run this on Android or iOS
      </Text>
    </View>
  );
}

export default function App() {
  return Platform.OS === 'android' || Platform.OS === 'ios' ? <AppMain /> : <UnsupportedPlatform />;
}
