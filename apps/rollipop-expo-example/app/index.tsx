import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Home screen that links to every route shape the integration must support:
// static, dynamic [id], rest [...slug], grouped (marketing), modal, and a
// deliberately-broken href to trigger +not-found. Also exercises native
// capabilities (clipboard + camera/media) through rollipop on device.
export default function Home() {
  const router = useRouter();
  const link = { color: '#0a84ff', fontSize: 18, marginVertical: 6 } as const;

  const [clipboardStatus, setClipboardStatus] = useState('');
  const [mediaStatus, setMediaStatus] = useState('');

  const copySample = async () => {
    try {
      await Clipboard.setStringAsync('Sample text copied from rollipop example');
      const value = await Clipboard.getStringAsync();
      setClipboardStatus(value ? `Copied: "${value}"` : 'Copied (empty)');
    } catch (e) {
      setClipboardStatus('Copy failed: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const requestCameraMedia = async () => {
    try {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cam.status !== 'granted' && lib.status !== 'granted') {
        setMediaStatus('Permission denied (camera + media)');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });
      if (result.canceled) {
        setMediaStatus('Picker canceled');
        return;
      }
      setMediaStatus('Picked: ' + result.assets[0].uri.slice(0, 48) + '...');
    } catch (e) {
      setMediaStatus('Media failed: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 8 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Rollipop + Expo Router</Text>
      <Link href="/about" style={link}>
        Static: /about
      </Link>
      <Link href="/users" style={link}>
        Nested layout: /users
      </Link>
      <Link href="/users/42" style={link}>
        Dynamic: /users/42
      </Link>
      <Link href="/blog/2026/08/hello" style={link}>
        Rest: /blog/2026/08/hello
      </Link>
      <Link href="/pricing" style={link}>
        Group (folds up): /pricing
      </Link>
      <Link href="/terms" style={link}>
        Group (folds up): /terms
      </Link>
      <Link href="/modal" style={link}>
        Modal: /modal
      </Link>
      <Link href="/this-route-does-not-exist" style={link}>
        Not-found: /this-route-does-not-exist
      </Link>
      <Pressable onPress={() => router.push('/about')}>
        <Text style={link}>Push /about (imperative)</Text>
      </Pressable>

      <View
        style={{
          marginTop: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: '#444',
          borderRadius: 8,
          gap: 8,
        }}>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Native capabilities</Text>
        <Pressable
          onPress={copySample}
          style={{ padding: 10, backgroundColor: '#0a84ff', borderRadius: 6 }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>Copy Sample</Text>
        </Pressable>
        <Text style={{ fontSize: 14 }}>
          {clipboardStatus || 'Tap to copy a sample string to the clipboard.'}
        </Text>
        <Pressable
          onPress={requestCameraMedia}
          style={{ padding: 10, backgroundColor: '#34c759', borderRadius: 6, marginTop: 8 }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>Request Camera Media</Text>
        </Pressable>
        <Text style={{ fontSize: 14 }}>
          {mediaStatus || 'Tap to request camera/media permission and pick an image.'}
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
