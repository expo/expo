import { ContextMenu, Button, Link, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import PreviewIndex from './(stack)/index';

export default function Index() {
  const router = useRouter();
  return (
    <>
      <Text>Index</Text>
      <Link href="/(stack)">/(stack)</Link>
      <Link href="/(tabs)">/(tabs)</Link>
      <ContextMenu
        style={{ width: 150, height: 50 }}
        activationMethod="longPress"
        onPreviewTap={() => {
          router.push('/(stack)');
        }}>
        <ContextMenu.Items>
          <Button
            systemImage="person.crop.circle.badge.xmark"
            onPress={() => console.log('Pressed1')}>
            Hello
          </Button>
          <Button variant="bordered" systemImage="heart" onPress={() => console.log('Pressed2')}>
            Love it
          </Button>
        </ContextMenu.Items>
        <ContextMenu.Preview>
          <View>
            <PreviewIndex />
          </View>
        </ContextMenu.Preview>
        <ContextMenu.Trigger>
          <Button variant="bordered" style={{ width: 150, height: 50 }}>
            Show Menu
          </Button>
        </ContextMenu.Trigger>
      </ContextMenu>
    </>
  );
}
