import { Paths, ExpoFile, Directory } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Button, ScrollView, StyleSheet, View, Text } from 'react-native';

import HeadingText from '../components/HeadingText';
import { useEffect, useState } from 'react';

FileSystemScreen.navigationOptions = {
  title: 'FileSystem',
};

export default function FileSystemScreen() {
  const [pickedFile, setPickedFile] = useState<ExpoFile | null>(null);
  const [pickedDir, setPickedDir] = useState<Directory | null>(null);
  const [pickedDirs, setPickedDirs] = useState<Directory[] | null>(null);
  const [soemText, setSomeText] = useState<string>('Text: ');
  const [pickedFiles, setPickedFiles] = useState<ExpoFile[] | null>(null);

  useEffect(() => {
    try {
      const pd = Directory.pickDirectoryAsync() as Promise<Directory>;
      pd?.then((dir) => {
        console.log(`name: ${dir.name}`);
        console.log(`uri: ${dir.uri}`);
        setSomeText('Text: ' + dir.name);
        setPickedDir(dir);
      });
    } catch (error) {
      console.error(error);
    }
    // (anyFile as ExpoFile).;
    try {
      const pd = Directory.pickDirectoryAsync();
      pd.then((dir) => {
        setPickedDir(dir as Directory);
        console.log(`dir name: ${(dir as Directory).name}`);
      });
    } catch (error) {
      console.log(error);
    }
    try {
      const pf = ExpoFile.pickFileAsync();
      pf.then((file) => {
        setPickedFile(file as ExpoFile);
        console.log(`file name: ${(file as ExpoFile).name}`);
      });
    } catch (error) {
      console.log(error);
    }
    try {
      const pfs = ExpoFile.pickFileAsync({ multipleFiles: true });
      pfs.then((files: ExpoFile[]) => {
        setPickedFiles(files);
        console.log(`files count: ${files}
    files0 name: ${files[0]?.name}
    files1 name: ${files[1]?.name}
    `);
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

  return (
    <ScrollView>
      <View style={styles.container}>
        <HeadingText>.contentUri property</HeadingText>
        <Button
          title="From file"
          onPress={async () => {
            const file = new ExpoFile(Paths.cache, 'file.txt');
            file.write('123');
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: 'text/plain',
            });
          }}
        />
        <Text>Open .pem certificate from BareExpo (should show modal that it's not possible)</Text>
        <Button
          title="From asset"
          onPress={async () => {
            const file = new ExpoFile(Paths.bundle, 'expo-root.pem');
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: 'application/x-pem-file',
            });
          }}
        />
        <Button
          title="From SAF"
          onPress={async () => {
            const res = await ExpoFile.pickFileAsync();
            const file = Array.isArray(res) ? res[0] : res;
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: file.type,
            });
          }}
        />
      </View>
      <View>
        <Text>{'name ' + soemText}</Text>
        <Text>{'pd name ' + pickedDir?.name}</Text>
        <Text>{'pd uri ' + pickedDir?.uri}</Text>
        <Text>{'pfs len ' + pickedFiles?.length}</Text>
        <Text>{'pfs 0 ' + pickedFiles?.[0]?.name}</Text>
        <Text>{'pfs 1 ' + pickedFiles?.[1]?.name}</Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageBox: {
    padding: 10,
    borderWidth: 1,
  },
  picker: {
    borderWidth: 1,
    padding: 0,
    margin: 0,
  },
  container: {
    padding: 10,
    gap: 10,
  },
});
